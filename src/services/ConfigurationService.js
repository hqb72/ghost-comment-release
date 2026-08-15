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
exports.configurationService = exports.ConfigurationService = void 0;
const vscode = __importStar(require("vscode"));
const types_1 = require("../types");
const CONFIG_NAMESPACE = 'ghostComment';
class ConfigurationService {
    getConfig() {
        return vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    }
    getDisplayProvider() {
        const value = this.getConfig().get('displayProvider', types_1.DEFAULT_DISPLAY_PROVIDER);
        if (value === 'lineTop' || value === 'lineEnd') {
            return value;
        }
        return types_1.DEFAULT_DISPLAY_PROVIDER;
    }
    getCacheMaxTextLength() {
        const value = this.getConfig().get('cache.maxTextLength', types_1.DEFAULT_CACHE_MAX_TEXT_LENGTH);
        if (!Number.isFinite(value) || value < 1) {
            return types_1.DEFAULT_CACHE_MAX_TEXT_LENGTH;
        }
        return Math.floor(value);
    }
    getCacheMaxFiles() {
        const value = this.getConfig().get('cache.maxFiles', types_1.DEFAULT_CACHE_MAX_FILES);
        if (!Number.isFinite(value) || value < 1) {
            return types_1.DEFAULT_CACHE_MAX_FILES;
        }
        return Math.floor(value);
    }
    getCommentPrefixMode() {
        const value = this.getConfig().get('commentPrefix.mode', types_1.DEFAULT_COMMENT_PREFIX_MODE);
        if (value === 'default' || value === 'emoji' || value === 'custom') {
            return value;
        }
        return types_1.DEFAULT_COMMENT_PREFIX_MODE;
    }
    getCommentPrefixCustomText() {
        const value = this.getConfig().get('commentPrefix.customText', types_1.DEFAULT_COMMENT_PREFIX_TEXT);
        if (typeof value !== 'string') {
            return types_1.DEFAULT_COMMENT_PREFIX_TEXT;
        }
        return value;
    }
    getSummaryMode() {
        const value = this.getConfig().get('summary.mode', types_1.DEFAULT_COMMENT_SUMMARY_MODE);
        if (value === 'full' || value === 'firstSentence' || value === 'firstParagraph') {
            return value;
        }
        return types_1.DEFAULT_COMMENT_SUMMARY_MODE;
    }
    getMergeStrategy() {
        const value = this.getConfig().get('hover.mergeStrategy', types_1.DEFAULT_HOVER_MERGE_STRATEGY);
        if (value === 'first' || value === 'shortest' || value === 'longest' || value === 'join') {
            return value;
        }
        return types_1.DEFAULT_HOVER_MERGE_STRATEGY;
    }
    getFilterLowValue() {
        return this.getConfig().get('hover.filterLowValue', types_1.DEFAULT_FILTER_LOW_VALUE);
    }
    getEnabledLanguages() {
        const value = this.getConfig().get('languages.enabled', types_1.DEFAULT_ENABLED_LANGUAGES);
        if (!Array.isArray(value)) {
            return types_1.DEFAULT_ENABLED_LANGUAGES;
        }
        const normalized = value
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
        return normalized.length > 0 ? normalized : types_1.DEFAULT_ENABLED_LANGUAGES;
    }
    isLanguageEnabled(languageId) {
        return this.getEnabledLanguages().includes(languageId);
    }
    getEnabledSymbolKinds() {
        const value = this.getConfig().get('symbolKinds.enabled', types_1.DEFAULT_ENABLED_SYMBOL_KINDS);
        if (!Array.isArray(value)) {
            return types_1.DEFAULT_ENABLED_SYMBOL_KINDS;
        }
        const normalized = value
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
        return normalized.length > 0 ? normalized : types_1.DEFAULT_ENABLED_SYMBOL_KINDS;
    }
    isSymbolKindEnabled(kind) {
        return this.getEnabledSymbolKinds().includes(kind);
    }
    getVisibilityMode() {
        const value = this.getConfig().get('visibility.mode', types_1.DEFAULT_VISIBILITY_MODE);
        if (value === 'allVisible' || value === 'currentLine' || value === 'nearCursor') {
            return value;
        }
        return types_1.DEFAULT_VISIBILITY_MODE;
    }
    getNearCursorRadius() {
        const value = this.getConfig().get('visibility.nearCursorRadius', types_1.DEFAULT_NEAR_CURSOR_RADIUS);
        if (!Number.isFinite(value) || value < 0) {
            return types_1.DEFAULT_NEAR_CURSOR_RADIUS;
        }
        return Math.floor(value);
    }
    getExtractorPatterns() {
        const raw = this.getConfig().get('extractor.patterns', types_1.DEFAULT_EXTRACTOR_PATTERNS);
        return this.normalizePatterns(raw);
    }
    normalizePatterns(raw) {
        if (!raw || typeof raw !== 'object') {
            return types_1.DEFAULT_EXTRACTOR_PATTERNS;
        }
        const result = {};
        for (const [suffix, rules] of Object.entries(raw)) {
            if (!Array.isArray(rules))
                continue;
            const normalizedRules = rules
                .map((rule) => this.normalizeRule(rule))
                .filter((rule) => Boolean(rule));
            if (normalizedRules.length > 0) {
                result[suffix.toLowerCase()] = normalizedRules;
            }
        }
        if (!Array.isArray(result.default) || result.default.length === 0) {
            result.default = types_1.DEFAULT_EXTRACTOR_PATTERNS.default;
        }
        return result;
    }
    normalizeRule(rule) {
        if (!rule || typeof rule !== 'object')
            return null;
        const candidate = rule;
        if (typeof candidate.pattern !== 'string' || candidate.pattern.trim().length === 0) {
            return null;
        }
        const group = Number(candidate.positionGroup);
        if (!Number.isInteger(group) || group < 1) {
            return null;
        }
        const flags = typeof candidate.flags === 'string' ? candidate.flags : 'g';
        return {
            kind: typeof candidate.kind === 'string' ? candidate.kind : 'member',
            pattern: candidate.pattern,
            positionGroup: group,
            flags: flags.includes('g') ? flags : `${flags}g`,
            enabled: candidate.enabled !== false
        };
    }
}
exports.ConfigurationService = ConfigurationService;
exports.configurationService = new ConfigurationService();
