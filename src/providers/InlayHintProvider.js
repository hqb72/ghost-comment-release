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
exports.DocCodeLensProvider = exports.DocInlayProvider = void 0;
exports.notifyCommentDecorationsChanged = notifyCommentDecorationsChanged;
const vscode = __importStar(require("vscode"));
const CacheService_1 = require("../services/CacheService");
const ConfigurationService_1 = require("../services/ConfigurationService");
const DocumentRefreshService_1 = require("../services/DocumentRefreshService");
const types_1 = require("../types");
const inlayHintsChangeEmitter = new vscode.EventEmitter();
const codeLensChangeEmitter = new vscode.EventEmitter();
function notifyCommentDecorationsChanged() {
    inlayHintsChangeEmitter.fire();
    codeLensChangeEmitter.fire();
}
function withPrefix(text) {
    return resolvePrefix() + text;
}
const colorEmojiIcons = [
    '▶️', '⏸️', '⏹️', '⏺️', '⏭️', '⏮️', '🔀', '🔁', '🔂',
    '🔇', '🔈', '🔉', '🔊', '🎙️', '🎚️', '🎛️',
    '📺', '📽️', '🎞️', '📷', '📸', '🎥', '📽️', '💡',
    '🌐', '📶', '📡', '🔌', '🔋', '💻', '🖥️', '🖨️',
    '⌨️', '🖥️', '🖲️', '💽', '💾', '💿', '📀', '🧮',
    '📊', '📈', '📉', '🗓️', '📆', '📝', '📝', '📐', '📏',
    '🗂️', '🗃️', '🗳️',
    '📍', '🚩', '🏗️', '🏠', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨',
    '🚗', '🚕', '🚙', '🚌', '🚎', '🚑', '🚒', '✈️', '🚀', '🛸',
    '⛽', '🚦', '🚧', '⚓', '🗺️', '🧭',
    '☀️', '🌙', '⭐', '🌟', '☁️', '⛅', '⛈️', '🌤️', '🌩️', '🌪️',
    '🌈', '❄️', '💧', '🔥', '🌊', '🍂', '🌸', '🌳', '🌵', '🍄',
    '👆', '👇', '👈', '👉', '✋', '🖖', '👌', '🤏', '✌️', '🤞',
    '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎',
    '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '💪',
    '🔑', '🗝️', '🔒', '🔓', '🔨', '🪓', '⛏️', '🔧', '🔩',
    '⚙️', '⚖️', '🦯', '🔗', '⛓️', '🧲', '🧿',
    '💰', '💳', '🎀', '🎉', '🎊', '🏆', '🥇', '🎖️', '🎗️'
];
function randomTextIcon() {
    return colorEmojiIcons[Math.floor(Math.random() * colorEmojiIcons.length)] + ' ';
}
function resolvePrefix() {
    const mode = ConfigurationService_1.configurationService.getCommentPrefixMode();
    if (mode === 'emoji') {
        return randomTextIcon();
    }
    if (mode === 'custom') {
        const custom = ConfigurationService_1.configurationService.getCommentPrefixCustomText();
        return custom.length > 0 ? custom : types_1.DEFAULT_COMMENT_PREFIX_TEXT;
    }
    return types_1.DEFAULT_COMMENT_PREFIX_TEXT;
}
class DocInlayProvider {
    constructor() {
        this.onDidChangeInlayHints = inlayHintsChangeEmitter.event;
    }
    provideInlayHints(document, viewPort, token) {
        const hints = [];
        const uriKey = document.uri.toString();
        for (let line = viewPort.start.line; line <= viewPort.end.line; line++) {
            if (!DocumentRefreshService_1.documentRefreshService.shouldRenderLine(document, line)) {
                continue;
            }
            const key = `${uriKey}:${line}`;
            const comment = CacheService_1.cacheService.get(key);
            if (!comment)
                continue;
            const lineEnd = document.lineAt(line).range.end;
            const hint = new vscode.InlayHint(lineEnd, withPrefix(comment.renderedText), vscode.InlayHintKind.Type);
            hint.paddingLeft = true;
            hints.push(hint);
        }
        return hints;
    }
}
exports.DocInlayProvider = DocInlayProvider;
class DocCodeLensProvider {
    constructor() {
        this.onDidChangeCodeLenses = codeLensChangeEmitter.event;
    }
    provideCodeLenses(document, token) {
        const lenses = [];
        const uriKey = document.uri.toString();
        const editor = vscode.window.visibleTextEditors.find((item) => item.document.uri.toString() === uriKey);
        const ranges = editor?.visibleRanges?.length
            ? editor.visibleRanges
            : [new vscode.Range(0, 0, Math.max(0, document.lineCount - 1), 0)];
        for (const range of ranges) {
            for (let line = range.start.line; line <= range.end.line; line++) {
                if (!DocumentRefreshService_1.documentRefreshService.shouldRenderLine(document, line)) {
                    continue;
                }
                const key = `${uriKey}:${line}`;
                const comment = CacheService_1.cacheService.get(key);
                if (!comment)
                    continue;
                const lineRange = new vscode.Range(line, 0, line, 0);
                const lens = new vscode.CodeLens(lineRange);
                lens.command = {
                    title: withPrefix(comment.renderedText),
                    command: ''
                };
                lenses.push(lens);
            }
        }
        return lenses;
    }
}
exports.DocCodeLensProvider = DocCodeLensProvider;
