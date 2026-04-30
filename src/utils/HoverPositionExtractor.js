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
exports.HoverPositionExtractor = void 0;
const vscode = __importStar(require("vscode"));
const ConfigurationService_1 = require("../services/ConfigurationService");
class HoverPositionExtractor {
    constructor() {
        this.compiledRulesCache = new Map();
        this.patternsCacheKey = '';
    }
    extract(editor) {
        const doc = editor.document;
        const visibleRange = editor.visibleRanges[0];
        if (!visibleRange)
            return [];
        const extension = this.getFileExtension(doc.fileName);
        const rules = this.getRulesForExtension(extension);
        const positions = [];
        const seen = new Set();
        for (let line = visibleRange.start.line; line <= visibleRange.end.line; line++) {
            const lineText = doc.lineAt(line).text;
            const trimmedLine = lineText.trim();
            if (this.isCommentLine(trimmedLine)) {
                continue;
            }
            const linePositions = this.extractPositionsFromLine(lineText, line, rules);
            for (const pos of linePositions) {
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
        return line.startsWith('//') || line.startsWith('*') || line.startsWith('/*');
    }
    extractPositionsFromLine(lineText, line, rules) {
        const positions = [];
        for (const rule of rules) {
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
                const character = match.index + groupIndexInMatch;
                positions.push(new vscode.Position(line, character));
            }
        }
        return positions;
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
