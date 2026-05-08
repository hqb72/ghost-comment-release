"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.hoverService = exports.HoverService = void 0;
const vscode = __importStar(require("vscode"));
const ConfigurationService_1 = require("./ConfigurationService");
const types_1 = require("../types");
class HoverService {
    async getHovers(document, position) {
        return vscode.commands.executeCommand('vscode.executeHoverProvider', document.uri, position);
    }
    parseHoverItems(hovers) {
        if (!hovers || !hovers.length)
            return [];
        const contents = hovers.flatMap((hover) => Array.isArray(hover.contents) ? hover.contents : [hover.contents]);
        const uniqueTexts = new Set();
        return contents
            .map((c) => typeof c === 'string' ? c : (c.value ?? String(c)))
            .map((text) => text.replace(/\s+/g, ' ').trim())
            .filter((text) => text.length > 0)
            .filter((text) => !text.startsWith('[Go to Super Implementation]'))
            .filter((text) => !text.startsWith('Source'))
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
    renderHoverText(items) {
        if (items.length === 0) {
            return { text: '', truncated: false };
        }
        const filteredItems = ConfigurationService_1.configurationService.getFilterLowValue()
            ? items.filter((item) => !item.isLowValue)
            : items;
        const filteredOut = filteredItems.length === 0 && items.length > 0;
        const candidates = filteredItems.length > 0 ? filteredItems : items;
        const mergedItems = this.mergeItems(candidates);
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
    isLowValueText(text) {
        if (text.length === 0)
            return true;
        if (/^```[\s\S]*```$/.test(text))
            return true;
        if (/^[\w$.]+\s*\([^)]*\)$/.test(text) && !/\s/.test(text.replace(/[(),]/g, '')))
            return true;
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
exports.HoverService = HoverService;
exports.hoverService = new HoverService();
