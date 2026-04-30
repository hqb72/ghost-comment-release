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
const DocumentRefreshService_1 = require("./services/DocumentRefreshService");
const ConfigurationService_1 = require("./services/ConfigurationService");
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
