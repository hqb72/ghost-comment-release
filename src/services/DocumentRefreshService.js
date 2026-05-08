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
exports.documentRefreshService = exports.DocumentRefreshService = void 0;
const vscode = __importStar(require("vscode"));
const CacheService_1 = require("../services/CacheService");
const CommentDiagnosticService_1 = require("../services/CommentDiagnosticService");
const ConfigurationService_1 = require("../services/ConfigurationService");
const HoverService_1 = require("../services/HoverService");
const InlayHintProvider_1 = require("../providers/InlayHintProvider");
const HoverPositionExtractor_1 = require("../utils/HoverPositionExtractor");
const types_1 = require("../types");
class DocumentRefreshService {
    constructor() {
        this.refreshTimer = null;
        this.activeRequests = new Map();
        this.disposables = [];
        this.documentVersions = new Map();
        this.parsedLineCache = new Map();
        this.pinnedLines = new Map();
        this.extractor = new HoverPositionExtractor_1.HoverPositionExtractor();
    }
    activate(context) {
        this.disposables.push(vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
            this.refresh(e.textEditor);
        }));
        this.disposables.push(vscode.workspace.onDidCloseTextDocument((doc) => {
            const uriKey = doc.uri.toString();
            this.cancelRequest(uriKey);
            CacheService_1.cacheService.clearByUri(uriKey);
            this.pinnedLines.delete(uriKey);
            this.parsedLineCache.delete(uriKey);
            this.documentVersions.delete(uriKey);
        }));
        this.disposables.push(vscode.window.onDidChangeTextEditorSelection((event) => {
            this.refresh(event.textEditor);
            (0, InlayHintProvider_1.notifyCommentDecorationsChanged)();
        }));
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        this.activeRequests.clear();
        this.documentVersions.clear();
        this.pinnedLines.clear();
        this.parsedLineCache.clear();
    }
    refresh(editor) {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.refreshTimer = setTimeout(async () => {
            await this.updateCache(editor);
        }, types_1.DEBOUNCE_DELAY);
    }
    async forceRefresh(editor) {
        const uriKey = editor.document.uri.toString();
        this.cancelRequest(uriKey);
        CacheService_1.cacheService.clearByUri(uriKey);
        this.parsedLineCache.set(uriKey, new Set());
        this.documentVersions.delete(uriKey);
        await this.updateCache(editor);
        (0, InlayHintProvider_1.notifyCommentDecorationsChanged)();
    }
    togglePin(editor) {
        const uriKey = editor.document.uri.toString();
        const currentLine = editor.selection.active.line;
        const lines = this.pinnedLines.get(uriKey) ?? new Set();
        let pinned = false;
        if (lines.has(currentLine)) {
            lines.delete(currentLine);
        }
        else {
            lines.add(currentLine);
            pinned = true;
        }
        if (lines.size === 0) {
            this.pinnedLines.delete(uriKey);
        }
        else {
            this.pinnedLines.set(uriKey, lines);
        }
        (0, InlayHintProvider_1.notifyCommentDecorationsChanged)();
        return pinned;
    }
    shouldRenderLine(document, line) {
        const editor = vscode.window.visibleTextEditors.find((item) => item.document.uri.toString() === document.uri.toString());
        if (!editor) {
            return false;
        }
        const shouldRender = this.getDisplayLines(editor).has(line);
        if (!shouldRender) {
            CommentDiagnosticService_1.commentDiagnosticService.set(document.uri.toString(), line, 'notInVisibleScope');
        }
        return shouldRender;
    }
    cancelRequest(uriKey) {
        const controller = this.activeRequests.get(uriKey);
        if (controller) {
            controller.abort();
            this.activeRequests.delete(uriKey);
        }
    }
    async updateCache(editor) {
        const doc = editor.document;
        const uriKey = doc.uri.toString();
        if (!ConfigurationService_1.configurationService.isLanguageEnabled(doc.languageId)) {
            CommentDiagnosticService_1.commentDiagnosticService.set(uriKey, editor.selection.active.line, 'languageDisabled', doc.languageId);
            return;
        }
        const visibleRange = editor.visibleRanges[0];
        if (!visibleRange)
            return;
        const currentVersion = doc.version;
        const previousVersion = this.documentVersions.get(uriKey);
        if (previousVersion !== currentVersion) {
            this.parsedLineCache.set(uriKey, new Set());
            this.documentVersions.set(uriKey, currentVersion);
            CacheService_1.cacheService.clearByUri(uriKey);
            CommentDiagnosticService_1.commentDiagnosticService.clearByUri(uriKey);
        }
        this.cancelRequest(uriKey);
        const controller = new AbortController();
        this.activeRequests.set(uriKey, controller);
        try {
            const positions = this.extractor.extract(editor, this.getDisplayLines(editor));
            const lineMap = await this.buildLineMap(doc, positions, controller.signal, uriKey);
            if (controller.signal.aborted)
                return;
            for (const [line, items] of lineMap) {
                if (controller.signal.aborted)
                    return;
                const rendered = HoverService_1.hoverService.renderHoverText(items);
                if (!rendered.text) {
                    if (rendered.filteredLowValue) {
                        CommentDiagnosticService_1.commentDiagnosticService.set(uriKey, line, 'filteredLowValue');
                    }
                    this.markLineParsed(uriKey, line);
                    continue;
                }
                const commentData = {
                    line,
                    items,
                    renderedText: rendered.text,
                    truncated: rendered.truncated
                };
                CacheService_1.cacheService.set(`${uriKey}:${line}`, commentData);
                CommentDiagnosticService_1.commentDiagnosticService.set(uriKey, line, 'cached');
                this.markLineParsed(uriKey, line);
            }
        }
        finally {
            this.activeRequests.delete(uriKey);
        }
    }
    async buildLineMap(doc, positions, signal, uriKey) {
        const lineMap = new Map();
        const pendingPositions = this.filterPendingPositions(positions, uriKey);
        if (pendingPositions.length === 0) {
            return lineMap;
        }
        for (let i = 0; i < pendingPositions.length; i += types_1.HOVER_CONCURRENCY_LIMIT) {
            if (signal.aborted)
                return lineMap;
            const batch = pendingPositions.slice(i, i + types_1.HOVER_CONCURRENCY_LIMIT);
            const results = await Promise.all(batch.map(async (pos) => {
                const hovers = await HoverService_1.hoverService.getHovers(doc, new vscode.Position(pos.line, pos.character));
                return { pos, items: HoverService_1.hoverService.parseHoverItems(hovers || []) };
            }));
            if (signal.aborted)
                return lineMap;
            for (const result of results) {
                if (signal.aborted)
                    return lineMap;
                const line = result.pos.line;
                if (!lineMap.has(line))
                    lineMap.set(line, []);
                if (result.items.length > 0) {
                    lineMap.get(line).push(...result.items);
                }
            }
        }
        return lineMap;
    }
    filterPendingPositions(positions, uriKey) {
        const parsedLines = this.parsedLineCache.get(uriKey) ?? new Set();
        const seenLines = new Set();
        const pending = [];
        for (const pos of positions) {
            const line = pos.line;
            if (parsedLines.has(line)) {
                CommentDiagnosticService_1.commentDiagnosticService.set(uriKey, line, 'lineAlreadyParsed');
                continue;
            }
            if (seenLines.has(line))
                continue;
            seenLines.add(line);
            pending.push(pos);
        }
        return pending;
    }
    markLineParsed(uriKey, line) {
        const parsedLines = this.parsedLineCache.get(uriKey) ?? new Set();
        parsedLines.add(line);
        this.parsedLineCache.set(uriKey, parsedLines);
    }
    getDisplayLines(editor) {
        const visibleRange = editor.visibleRanges[0];
        if (!visibleRange) {
            return new Set();
        }
        const lines = new Set();
        const mode = ConfigurationService_1.configurationService.getVisibilityMode();
        const activeLine = editor.selection.active.line;
        if (mode === 'allVisible') {
            for (let line = visibleRange.start.line; line <= visibleRange.end.line; line++) {
                lines.add(line);
            }
        }
        else if (mode === 'currentLine') {
            if (activeLine >= visibleRange.start.line && activeLine <= visibleRange.end.line) {
                lines.add(activeLine);
            }
        }
        else {
            const radius = ConfigurationService_1.configurationService.getNearCursorRadius();
            const start = Math.max(visibleRange.start.line, activeLine - radius);
            const end = Math.min(visibleRange.end.line, activeLine + radius);
            for (let line = start; line <= end; line++) {
                lines.add(line);
            }
        }
        const pinnedLines = this.pinnedLines.get(editor.document.uri.toString());
        if (pinnedLines) {
            for (const pinnedLine of pinnedLines) {
                if (pinnedLine >= visibleRange.start.line && pinnedLine <= visibleRange.end.line) {
                    lines.add(pinnedLine);
                }
            }
        }
        return lines;
    }
}
exports.DocumentRefreshService = DocumentRefreshService;
exports.documentRefreshService = new DocumentRefreshService();
