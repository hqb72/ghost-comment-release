"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOVER_CONCURRENCY_LIMIT = exports.DEBOUNCE_DELAY = exports.DEFAULT_EXTRACTOR_PATTERNS = exports.DEFAULT_ENABLED_SYMBOL_KINDS = exports.DEFAULT_ENABLED_LANGUAGES = exports.DEFAULT_COMMENT_PREFIX_TEXT = exports.DEFAULT_NEAR_CURSOR_RADIUS = exports.DEFAULT_VISIBILITY_MODE = exports.DEFAULT_FILTER_LOW_VALUE = exports.DEFAULT_HOVER_MERGE_STRATEGY = exports.DEFAULT_COMMENT_SUMMARY_MODE = exports.DEFAULT_COMMENT_PREFIX_MODE = exports.DEFAULT_CACHE_MAX_FILES = exports.DEFAULT_CACHE_MAX_TEXT_LENGTH = exports.DEFAULT_DISPLAY_PROVIDER = void 0;
exports.DEFAULT_DISPLAY_PROVIDER = 'lineEnd';
exports.DEFAULT_CACHE_MAX_TEXT_LENGTH = 100;
exports.DEFAULT_CACHE_MAX_FILES = 20;
exports.DEFAULT_COMMENT_PREFIX_MODE = 'default';
exports.DEFAULT_COMMENT_SUMMARY_MODE = 'firstSentence';
exports.DEFAULT_HOVER_MERGE_STRATEGY = 'join';
exports.DEFAULT_FILTER_LOW_VALUE = true;
exports.DEFAULT_VISIBILITY_MODE = 'allVisible';
exports.DEFAULT_NEAR_CURSOR_RADIUS = 2;
exports.DEFAULT_COMMENT_PREFIX_TEXT = '// ';
exports.DEFAULT_ENABLED_LANGUAGES = [
    'javascript',
    'typescript',
    'python',
    'java',
    'cpp',
    'c',
    'go',
    'rust',
    'php'
];
exports.DEFAULT_ENABLED_SYMBOL_KINDS = [
    'member',
    'method',
    'variable',
    'function'
];
exports.DEFAULT_EXTRACTOR_PATTERNS = {
    default: [
        {
            kind: 'member',
            pattern: '\\b([a-zA-Z_$][a-zA-Z0-9_$]*)\\.([a-zA-Z_$][a-zA-Z0-9_$]*)',
            positionGroup: 2,
            flags: 'g'
        }
    ]
};
exports.DEBOUNCE_DELAY = 300;
exports.HOVER_CONCURRENCY_LIMIT = 6;
