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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const InlayHintProvider_1 = require("./providers/InlayHintProvider");
const CacheService_1 = require("./services/CacheService");
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
        const visibilityMode = ConfigurationService_1.configurationService.getVisibilityMode();
        const renderLineEndOnly = visibilityMode === 'currentLine';
        if (displayProvider === 'lineEnd' || renderLineEndOnly) {
            providerDisposables.push(vscode.languages.registerInlayHintsProvider({ pattern: '**/*' }, new InlayHintProvider_1.DocInlayProvider()));
        }
        if (displayProvider === 'lineTop' && !renderLineEndOnly) {
            providerDisposables.push(vscode.languages.registerCodeLensProvider({ pattern: '**/*' }, new InlayHintProvider_1.DocCodeLensProvider()));
        }
    };
    registerProviders();
    DocumentRefreshService_1.documentRefreshService.activate(context);
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('ghostComment.displayProvider') ||
            event.affectsConfiguration('ghostComment.visibility.mode')) {
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
    context.subscriptions.push(vscode.commands.registerCommand('ghostComment.showCurrentLineDiagnostic', async () => {
        const currentEditor = vscode.window.activeTextEditor;
        if (!currentEditor) {
            return;
        }
        const uriKey = currentEditor.document.uri.toString();
        const line = currentEditor.selection.active.line;
        const diagnostic = CommentDiagnosticService_1.commentDiagnosticService.get(uriKey, line);
        const cache = CacheService_1.cacheService.get(`${uriKey}:${line}`);
        const doc = currentEditor.document;
        const lineText = doc.lineAt(line).text.trim();
        const truncatedText = lineText.length > 60 ? lineText.slice(0, 60) + '…' : lineText;
        const items = [
            {
                label: `第 ${line + 1} 行`,
                description: truncatedText
            }
        ];
        const diagnosticData = {
            timestamp: new Date().toISOString(),
            file: {
                uri: uriKey,
                path: doc.uri.fsPath,
                languageId: doc.languageId,
                line: line,
                lineNumber: line + 1,
                lineText: lineText
            }
        };
        if (cache) {
            items.push({
                label: '匹配规则',
                detail: `${cache.extractedKind || '无'} (字符位置: ${cache.extractedCharacter ?? '未知'})`
            });
            if (cache.extractedPattern) {
                items.push({
                    label: '正则表达式',
                    detail: cache.extractedPattern
                });
            }
            items.push({
                label: '提取原文',
                detail: cache.items.map((i) => i.text).join(' | ') || '无提取项'
            });
            items.push({
                label: '过滤后原文',
                detail: cache.renderedText || '为空'
            });
            items.push({
                label: '缓存时间',
                detail: new Date(cache.cachedAt).toLocaleTimeString()
            });
            diagnosticData.cache = {
                extractedKind: cache.extractedKind,
                extractedCharacter: cache.extractedCharacter,
                extractedPattern: cache.extractedPattern,
                items: cache.items.map((i) => ({ text: i.text })),
                renderedText: cache.renderedText,
                truncated: cache.truncated,
                cachedAt: new Date(cache.cachedAt).toISOString()
            };
        }
        else if (diagnostic) {
            items.push({
                label: '诊断原因',
                detail: getDiagnosticMessage(diagnostic.reason, diagnostic.detail)
            });
            items.push({
                label: '诊断时间',
                detail: new Date(diagnostic.timestamp).toLocaleTimeString()
            });
            diagnosticData.diagnostic = {
                reason: diagnostic.reason,
                detail: diagnostic.detail,
                timestamp: new Date(diagnostic.timestamp).toISOString()
            };
        }
        else {
            items.push({
                label: '暂无诊断信息',
                detail: '当前行尚未有诊断记录'
            });
        }
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const diagnosticFilePath = path.join(workspaceRoot, '.ghostcomment-diagnostic.json');
            let existingData = { diagnostics: [] };
            try {
                if (fs.existsSync(diagnosticFilePath)) {
                    const content = fs.readFileSync(diagnosticFilePath, 'utf-8');
                    existingData = JSON.parse(content);
                }
            }
            catch {
                existingData = { diagnostics: [] };
            }
            existingData.diagnostics.push(diagnosticData);
            fs.writeFileSync(diagnosticFilePath, JSON.stringify(existingData, null, 2), 'utf-8');
        }
        const selected = await vscode.window.showQuickPick(items, {
            title: 'Ghost Comment 行诊断 (点击复制)',
            placeHolder: '当前光标所在行的详细信息'
        });
        if (selected) {
            const fullText = `${selected.label}${selected.description ? ' - ' + selected.description : ''}${selected.detail ? ' | ' + selected.detail : ''}`;
            await vscode.env.clipboard.writeText(fullText);
            void vscode.window.showInformationMessage('已复制到剪贴板，诊断结果已保存到 .ghostcomment-diagnostic.json');
        }
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
