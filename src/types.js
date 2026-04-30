"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOVER_CONCURRENCY_LIMIT = exports.DEBOUNCE_DELAY = exports.DEFAULT_EXTRACTOR_PATTERNS = exports.DEFAULT_CACHE_MAX_FILES = exports.DEFAULT_CACHE_MAX_TEXT_LENGTH = exports.DEFAULT_DISPLAY_PROVIDER = void 0;
exports.DEFAULT_DISPLAY_PROVIDER = 'lineEnd';
exports.DEFAULT_CACHE_MAX_TEXT_LENGTH = 100;
exports.DEFAULT_CACHE_MAX_FILES = 20;
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
