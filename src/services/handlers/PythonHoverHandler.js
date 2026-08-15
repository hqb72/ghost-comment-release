"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonHoverHandler = void 0;
const BaseHoverHandler_1 = require("./BaseHoverHandler");
class PythonHoverHandler extends BaseHoverHandler_1.BaseHoverHandler {
    matches(languageId, extension) {
        return languageId === 'python' || extension === '.py';
    }
    cleanLanguageText(text) {
        return text
            .replace(/^class\s+/gm, '')
            .replace(/^def\s+/gm, '')
            .replace(/\b->\s*[^\s:]+/g, ' ')
            .trim();
    }
    removeSignatureNoise(text, _languageId, _extension) {
        return text.replace(/^\((?:function|method|class)\)\s*/i, '');
    }
    getLanguageAliases(_languageId, _extension) {
        return ['py', 'python'];
    }
}
exports.PythonHoverHandler = PythonHoverHandler;
