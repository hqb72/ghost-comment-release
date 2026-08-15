"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHoverHandler = void 0;
const ConfigurationService_1 = require("../ConfigurationService");
const types_1 = require("../../types");
class BaseHoverHandler {
    parse(document, hovers) {
        if (!hovers || !hovers.length)
            return [];
        const languageId = document.languageId;
        const extension = this.getFileExtension(document.fileName);
        const uniqueTexts = new Set();
        return hovers
            .flatMap((hover) => Array.isArray(hover.contents) ? hover.contents : [hover.contents])
            .map((content) => this.normalizeHoverContent(content, languageId, extension))
            .map((text) => text.replace(/\s+/g, ' ').trim())
            .filter((text) => text.length > 0)
            .filter((text) => {
            if (uniqueTexts.has(text))
                return false;
            uniqueTexts.add(text);
            return true;
        })
            .map((text) => this.truncateAtMarkers(text))
            .filter((text) => text.length > 0)
            .map((text) => ({
            text,
            isLowValue: this.isLowValueText(text)
        }));
    }
    render(items) {
        if (items.length === 0) {
            return { text: '', truncated: false };
        }
        const filteredItems = ConfigurationService_1.configurationService.getFilterLowValue()
            ? items.filter((item) => !item.isLowValue)
            : items;
        const filteredOut = filteredItems.length === 0 && items.length > 0;
        if (filteredOut && ConfigurationService_1.configurationService.getFilterLowValue()) {
            return { text: '', truncated: false, filteredLowValue: true };
        }
        const mergedItems = this.mergeItems(filteredItems);
        if (mergedItems.length === 0) {
            return { text: '', truncated: false, filteredLowValue: filteredOut };
        }
        const segments = mergedItems.map((item) => this.summarizeText(item.text));
        const rawText = segments.map((segment) => segment.text).join(' | ');
        const maxTextLength = ConfigurationService_1.configurationService.getCacheMaxTextLength();
        let text = rawText;
        let truncated = segments.some((segment) => segment.truncated);
        if (text.length > maxTextLength) {
            text = text.slice(0, Math.max(0, maxTextLength)).trimEnd() + '...';
            truncated = true;
        }
        return {
            text,
            truncated,
            filteredLowValue: filteredOut
        };
    }
    removeSignatureNoise(text, _languageId, _extension) {
        return text;
    }
    normalizeHoverContent(content, languageId, extension) {
        if (typeof content === 'string') {
            return this.processRawContent(content, languageId, extension, false);
        }
        if ('language' in content && 'value' in content) {
            return this.processRawContent(content.value ?? '', languageId, extension, true);
        }
        return this.processRawContent(content.value ?? String(content), languageId, extension, true);
    }
    processRawContent(text, languageId, extension, preferMarkdown) {
        let result = text;
        if (preferMarkdown) {
            result = this.extractMarkdownDocumentation(result, languageId, extension);
        }
        result = this.removeSignatureNoise(result, languageId, extension);
        result = this.truncateAtMarkers(result);
        result = this.cleanLanguageText(result);
        return result.trim();
    }
    extractMarkdownDocumentation(text, languageId, extension) {
        let result = text.replace(/\r/g, '').trim();
        const codeBlocks = [...result.matchAll(/```([\w-]*)\n([\s\S]*?)```/g)];
        if (codeBlocks.length === 0) {
            return result;
        }
        const nonCodeText = result.replace(/```[\s\S]*?```/g, ' ').trim();
        const matchingBlock = codeBlocks.find((match) => {
            const fenceLanguage = (match[1] || '').toLowerCase();
            return this.isMatchingLanguageFence(fenceLanguage, languageId, extension);
        });
        if (nonCodeText.length > 0) {
            return nonCodeText;
        }
        if (matchingBlock?.[2]) {
            return matchingBlock[2].trim();
        }
        return result;
    }
    truncateAtMarkers(text) {
        let result = text;
        const truncateArr = ['**Specified', '* **Parameters', '*@', '<!--'];
        for (const marker of truncateArr) {
            const index = result.indexOf(marker);
            if (index !== -1) {
                result = result.slice(0, index).trim();
            }
        }
        const replaceRegArr = ['```[\\s\\S]*?```', '---'];
        for (const reg of replaceRegArr) {
            result = result.replace(new RegExp(reg, 'g'), '');
        }
        return result.trim();
    }
    isMatchingLanguageFence(fenceLanguage, languageId, extension) {
        if (!fenceLanguage) {
            return false;
        }
        const aliases = new Set([
            languageId.toLowerCase(),
            extension.replace(/^\./, '').toLowerCase()
        ]);
        for (const alias of this.getLanguageAliases(languageId, extension)) {
            aliases.add(alias.toLowerCase());
        }
        return aliases.has(fenceLanguage.toLowerCase());
    }
    getLanguageAliases(_languageId, _extension) {
        return [];
    }
    getFileExtension(fileName) {
        const index = fileName.lastIndexOf('.');
        if (index === -1) {
            return '';
        }
        return fileName.slice(index).toLowerCase();
    }
    isLowValueText(text) {
        if (text.length === 0)
            return true;
        if (/^```[\s\S]*```$/.test(text))
            return true;
        if (/^[\w$.]+\s*\([^)]*\)$/.test(text) && !/\s/.test(text.replace(/[(),]/g, '')))
            return true;
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
        const totalChars = text.replace(/\s/g, '').length;
        const chineseRatio = totalChars > 0 ? chineseChars / totalChars : 0;
        if (chineseRatio <= 0.1 && text.length > 0) {
            return true;
        }
        if (/^[\w$.<>\[\],?\s|:&-]+$/.test(text) && !/[\u4e00-\u9fa5]/.test(text) && text.length < 24) {
            return true;
        }
        return false;
    }
    mergeItems(items) {
        const strategy = ConfigurationService_1.configurationService.getMergeStrategy();
        if (strategy === 'join') {
            return items;
        }
        if (strategy === 'first') {
            return items.slice(0, 1);
        }
        if (items.length === 0) {
            return [];
        }
        const sorted = [...items].sort((a, b) => a.text.length - b.text.length);
        return strategy === 'shortest'
            ? sorted.slice(0, 1)
            : sorted.slice(-1);
    }
    summarizeText(text) {
        const mode = ConfigurationService_1.configurationService.getSummaryMode();
        if (mode === 'full') {
            return { text, truncated: false };
        }
        if (mode === 'firstParagraph') {
            const paragraph = text.split(/\s{2,}|\n+/)[0]?.trim() ?? text;
            return {
                text: paragraph,
                truncated: paragraph.length < text.length
            };
        }
        const sentenceMatch = text.match(/^(.+?[。！？.!?])(?:\s|$)/);
        if (sentenceMatch?.[1]) {
            return {
                text: sentenceMatch[1].trim(),
                truncated: sentenceMatch[1].trim().length < text.length
            };
        }
        const fallback = text.slice(0, Math.min(text.length, types_1.DEFAULT_CACHE_MAX_TEXT_LENGTH)).trim();
        return {
            text: fallback,
            truncated: fallback.length < text.length
        };
    }
}
exports.BaseHoverHandler = BaseHoverHandler;
