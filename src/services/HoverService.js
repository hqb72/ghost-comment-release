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
exports.hoverService = exports.HoverService = void 0;
const vscode = __importStar(require("vscode"));
const JavaHoverHandler_1 = require("./handlers/JavaHoverHandler");
const PythonHoverHandler_1 = require("./handlers/PythonHoverHandler");
const TypeScriptHoverHandler_1 = require("./handlers/TypeScriptHoverHandler");
const GoHoverHandler_1 = require("./handlers/GoHoverHandler");
const GenericHoverHandler_1 = require("./handlers/GenericHoverHandler");
class HoverService {
    constructor() {
        this.handlers = [
            new JavaHoverHandler_1.JavaHoverHandler(),
            new PythonHoverHandler_1.PythonHoverHandler(),
            new TypeScriptHoverHandler_1.TypeScriptHoverHandler(),
            new GoHoverHandler_1.GoHoverHandler()
        ];
        this.defaultHandler = new GenericHoverHandler_1.GenericHoverHandler();
    }
    getHandler(document) {
        const languageId = document.languageId;
        const extension = this.getFileExtension(document.fileName);
        return this.handlers.find((h) => h.matches(languageId, extension)) ?? this.defaultHandler;
    }
    async getHovers(document, position) {
        return vscode.commands.executeCommand('vscode.executeHoverProvider', document.uri, position);
    }
    parseHoverItems(document, hovers) {
        return this.getHandler(document).parse(document, hovers);
    }
    renderHoverText(items) {
        return this.defaultHandler.render(items);
    }
    getFileExtension(fileName) {
        const index = fileName.lastIndexOf('.');
        if (index === -1) {
            return '';
        }
        return fileName.slice(index).toLowerCase();
    }
}
exports.HoverService = HoverService;
exports.hoverService = new HoverService();
