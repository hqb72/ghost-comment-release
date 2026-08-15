"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoHoverHandler = void 0;
const BaseHoverHandler_1 = require("./BaseHoverHandler");
class GoHoverHandler extends BaseHoverHandler_1.BaseHoverHandler {
    matches(languageId, extension) {
        return languageId === 'go' || extension === '.go';
    }
    cleanLanguageText(text) {
        return text
            .replace(/^func\s+/gm, '')
            .replace(/^type\s+/gm, '')
            .replace(/\bpackage\s+\w+\b/g, ' ')
            .trim();
    }
    getLanguageAliases(_languageId, _extension) {
        return ['go', 'golang'];
    }
}
exports.GoHoverHandler = GoHoverHandler;
