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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const InlayHintProvider_1 = require("./providers/InlayHintProvider");
const CommentDiagnosticService_1 = require("./services/CommentDiagnosticService");
const DocumentRefreshService_1 = require("./services/DocumentRefreshService");
const ConfigurationService_1 = require("./services/ConfigurationService");
function getDiagnosticMessage(reason, detail) {
    switch (reason) {
        case 'languageDisabled':
            return `当前语言未启用 Ghost Comment${detail ? `：${detail}` : ''}`;
        case 'notInVisibleScope':
            return '当前行不在可显示范围内';
        case 'noExtractorMatch':
            return '当前行没有匹配到可提取的符号';
        case 'symbolKindDisabled':
            return `当前符号类型被配置禁用：${detail || ''}`;
        case 'hoverEmpty':
            return '语言服务没有返回可用的 Hover 文档';
        case 'filteredLowValue':
            return 'Hover 内容被低价值过滤规则忽略了';
        case 'lineAlreadyParsed':
            return '当前行已在上一轮刷新中解析过（增量缓存）';
        case 'cached':
            return '当前行已有可显示的注释缓存';
        default:
            return detail ? `${reason} - ${detail}` : reason;
    }
}
function activate(context) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        DocumentRefreshService_1.documentRefreshService.refresh(editor);
    }
    let providerDisposables = [];
    const registerProviders = () => {
        for (const disposable of providerDisposables) {
            disposable.dispose();
        }
        providerDisposables = [];
        const displayProvider = ConfigurationService_1.configurationService.getDisplayProvider();
        if (displayProvider === 'lineEnd') {
            providerDisposables.push(vscode.languages.registerInlayHintsProvider({ pattern: '**/*' }, new InlayHintProvider_1.DocInlayProvider()));
        }
        if (displayProvider === 'lineTop') {
            providerDisposables.push(vscode.languages.registerCodeLensProvider({ pattern: '**/*' }, new InlayHintProvider_1.DocCodeLensProvider()));
        }
    };
    registerProviders();
    DocumentRefreshService_1.documentRefreshService.activate(context);
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('ghostComment.displayProvider')) {
            registerProviders();
        }
        if (event.affectsConfiguration('ghostComment')) {
            const currentEditor = vscode.window.activeTextEditor;
            if (currentEditor) {
                void DocumentRefreshService_1.documentRefreshService.forceRefresh(currentEditor);
            }
            (0, InlayHintProvider_1.notifyCommentDecorationsChanged)();
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ghostComment.refreshCurrentFile', async () => {
        const currentEditor = vscode.window.activeTextEditor;
        if (!currentEditor) {
            return;
        }
        await DocumentRefreshService_1.documentRefreshService.forceRefresh(currentEditor);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ghostComment.togglePinCurrentLine', () => {
        const currentEditor = vscode.window.activeTextEditor;
        if (!currentEditor) {
            return;
        }
        DocumentRefreshService_1.documentRefreshService.togglePin(currentEditor);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ghostComment.showCurrentLineDiagnostic', () => {
        const currentEditor = vscode.window.activeTextEditor;
        if (!currentEditor) {
            return;
        }
        const line = currentEditor.selection.active.line;
        const diagnostic = CommentDiagnosticService_1.commentDiagnosticService.get(currentEditor.document.uri.toString(), line);
        const lineText = currentEditor.document.lineAt(line).text.trim();
        const truncatedText = lineText.length > 60 ? lineText.slice(0, 60) + '…' : lineText;
        const items = [
            {
                label: `第 ${line + 1} 行`,
                description: truncatedText
            }
        ];
        if (!diagnostic) {
            items.push({
                label: '暂无诊断信息',
                detail: '当前行尚未有诊断记录'
            });
        }
        else {
            items.push({
                label: `诊断原因：${getDiagnosticMessage(diagnostic.reason, diagnostic.detail)}`,
                detail: `原始原因：${diagnostic.reason}${diagnostic.detail ? ` | 详情：${diagnostic.detail}` : ''}`
            });
        }
        void vscode.window.showQuickPick(items, {
            title: 'Ghost Comment 行诊断',
            placeHolder: '当前光标所在行的诊断信息'
        });
    }));
    context.subscriptions.push({
        dispose: () => {
            for (const disposable of providerDisposables) {
                disposable.dispose();
            }
            providerDisposables = [];
            DocumentRefreshService_1.documentRefreshService.dispose();
        }
    });
}
function deactivate() { }
