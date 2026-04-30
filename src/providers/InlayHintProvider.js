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
const vscode = __importStar(require("vscode"));
const CacheService_1 = require("../services/CacheService");
function withPrefix(text) {
    return '// ' + text;
}
class DocInlayProvider {
    provideInlayHints(document, viewPort, token) {
        const hints = [];
        const uriKey = document.uri.toString();
        for (let line = viewPort.start.line; line <= viewPort.end.line; line++) {
            const key = `${uriKey}:${line}`;
            const text = CacheService_1.cacheService.get(key);
            if (!text)
                continue;
            const lineEnd = document.lineAt(line).range.end;
            const hint = new vscode.InlayHint(lineEnd, withPrefix(text), vscode.InlayHintKind.Type);
            hint.paddingLeft = true;
            hints.push(hint);
        }
        return hints;
    }
}
exports.DocInlayProvider = DocInlayProvider;
class DocCodeLensProvider {
    provideCodeLenses(document, token) {
        const lenses = [];
        const uriKey = document.uri.toString();
        for (let line = 0; line < document.lineCount; line++) {
            const key = `${uriKey}:${line}`;
            const text = CacheService_1.cacheService.get(key);
            if (!text)
                continue;
            const range = new vscode.Range(line, 0, line, 0);
            const lens = new vscode.CodeLens(range);
            lens.command = {
                title: withPrefix(text),
                command: ''
            };
            lenses.push(lens);
        }
        return lenses;
    }
}
exports.DocCodeLensProvider = DocCodeLensProvider;
