"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericHoverHandler = void 0;
const BaseHoverHandler_1 = require("./BaseHoverHandler");
class GenericHoverHandler extends BaseHoverHandler_1.BaseHoverHandler {
    matches(_languageId, _extension) {
        return true;
    }
    cleanLanguageText(text) {
        return text
            .replace(/^[\w.-]+\s*\|\s*/gm, '')
            .trim();
    }
}
exports.GenericHoverHandler = GenericHoverHandler;
