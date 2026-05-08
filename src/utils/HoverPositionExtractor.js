"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoverPositionExtractor = void 0;
const CommentDiagnosticService_1 = require("../services/CommentDiagnosticService");
const ConfigurationService_1 = require("../services/ConfigurationService");
class HoverPositionExtractor {
    constructor() {
        this.compiledRulesCache = new Map();
        this.patternsCacheKey = '';
    }
    extract(editor, allowedLines) {
        const doc = editor.document;
        if (!ConfigurationService_1.configurationService.isLanguageEnabled(doc.languageId)) {
            return [];
        }
        const visibleRange = editor.visibleRanges[0];
        if (!visibleRange)
            return [];
        const extension = this.getFileExtension(doc.fileName);
        const rules = this.getRulesForExtension(extension);
        const uriKey = doc.uri.toString();
        const positions = [];
        const seen = new Set();
        for (let line = visibleRange.start.line; line <= visibleRange.end.line; line++) {
            if (allowedLines && !allowedLines.has(line)) {
                continue;
            }
            const lineText = doc.lineAt(line).text;
            const trimmedLine = lineText.trim();
            if (this.isCommentLine(trimmedLine)) {
                continue;
            }
            const result = this.extractPositionsFromLine(lineText, line, rules);
            if (result.positions.length === 0) {
                if (result.hadDisabledMatch && !result.hadEnabledMatch) {
                    CommentDiagnosticService_1.commentDiagnosticService.set(uriKey, line, 'symbolKindDisabled');
                }
                else if (!result.hadEnabledMatch) {
                    CommentDiagnosticService_1.commentDiagnosticService.set(uriKey, line, 'noExtractorMatch');
                }
            }
            for (const pos of result.positions) {
                const key = `${pos.line}:${pos.character}`;
                if (seen.has(key))
                    continue;
                seen.add(key);
                positions.push(pos);
            }
        }
        return positions;
    }
    isCommentLine(line) {
        return line.startsWith('//') || line.startsWith('*') || line.startsWith('/*') || line.startsWith('"""') || line.startsWith('#') || line.startsWith(';');
    }
    extractPositionsFromLine(lineText, line, rules) {
        const positions = [];
        let hadEnabledMatch = false;
        let hadDisabledMatch = false;
        for (const rule of rules) {
            if (!ConfigurationService_1.configurationService.isSymbolKindEnabled(rule.kind)) {
                rule.pattern.lastIndex = 0;
                if (rule.pattern.test(lineText)) {
                    hadDisabledMatch = true;
                }
                continue;
            }
            let match;
            rule.pattern.lastIndex = 0;
            while ((match = rule.pattern.exec(lineText)) !== null) {
                if (rule.kind === 'member' && this.isPartOfNumber(match.index, lineText)) {
                    continue;
                }
                const groupText = match[rule.positionGroup];
                if (!groupText)
                    continue;
                const wholeText = match[0];
                const groupIndexInMatch = wholeText.indexOf(groupText);
                if (groupIndexInMatch < 0)
                    continue;
                hadEnabledMatch = true;
                const character = match.index + groupIndexInMatch;
                positions.push({
                    line,
                    character,
                    kind: rule.kind
                });
            }
        }
        return { positions, hadEnabledMatch, hadDisabledMatch };
    }
    isPartOfNumber(index, lineText) {
        if (index === 0)
            return false;
        const charBefore = lineText[index - 1];
        return /\d/.test(charBefore);
    }
    getFileExtension(fileName) {
        const index = fileName.lastIndexOf('.');
        if (index === -1)
            return 'default';
        return fileName.slice(index).toLowerCase();
    }
    getRulesForExtension(extension) {
        const patterns = ConfigurationService_1.configurationService.getExtractorPatterns();
        const cacheKey = JSON.stringify(patterns);
        if (cacheKey !== this.patternsCacheKey) {
            this.compiledRulesCache.clear();
            this.patternsCacheKey = cacheKey;
        }
        const key = patterns[extension] ? extension : 'default';
        const cached = this.compiledRulesCache.get(key);
        if (cached)
            return cached;
        const rules = patterns[key] || patterns.default;
        const compiled = this.compileRules(rules);
        this.compiledRulesCache.set(key, compiled);
        return compiled;
    }
    compileRules(rules) {
        const compiled = [];
        for (const rule of rules) {
            if (rule.enabled === false)
                continue;
            try {
                const flags = rule.flags && rule.flags.includes('g') ? rule.flags : `${rule.flags || ''}g`;
                compiled.push({
                    kind: rule.kind,
                    pattern: new RegExp(rule.pattern, flags),
                    positionGroup: rule.positionGroup
                });
            }
            catch {
            }
        }
        return compiled;
    }
}
exports.HoverPositionExtractor = HoverPositionExtractor;
