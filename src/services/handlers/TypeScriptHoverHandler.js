"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptHoverHandler = void 0;
const BaseHoverHandler_1 = require("./BaseHoverHandler");
class TypeScriptHoverHandler extends BaseHoverHandler_1.BaseHoverHandler {
    matches(languageId, extension) {
        return languageId === 'typescript' || languageId === 'javascript'
            || extension === '.ts' || extension === '.js';
    }
    cleanLanguageText(text) {
        return text
            .replace(/\b(?:const|let|var|readonly|declare|export)\b/g, ' ')
            .replace(/\s*:\s*[^=|,;]+(?=$|\s{2,}|,|;)/g, ' ')
            .trim();
    }
    getLanguageAliases(languageId, extension) {
        const aliases = [];
        if (languageId === 'typescript' || extension === '.ts') {
            aliases.push('ts', 'typescript');
        }
        if (languageId === 'javascript' || extension === '.js') {
            aliases.push('js', 'javascript');
        }
        return aliases;
    }
}
exports.TypeScriptHoverHandler = TypeScriptHoverHandler;
