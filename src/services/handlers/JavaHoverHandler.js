"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaHoverHandler = void 0;
const BaseHoverHandler_1 = require("./BaseHoverHandler");
class JavaHoverHandler extends BaseHoverHandler_1.BaseHoverHandler {
    matches(languageId, extension) {
        return languageId === 'java' || extension === '.java';
    }
    parse(document, hovers) {
        if (!hovers || !hovers.length)
            return [];
        const languageId = document.languageId;
        const extension = this.getFileExtension(document.fileName);
        const normalized = hovers
            .flatMap((hover) => Array.isArray(hover.contents) ? hover.contents : [hover.contents])
            .map((content) => this.normalizeHoverContent(content, languageId, extension));
        let selected = null;
        if (normalized.length >= 4) {
            selected = normalized[2];
        }
        else if (normalized.length >= 3) {
            selected = normalized[1];
        }
        if (!selected)
            return [];
        let text = selected
            .replace(/\r?\n/g, ' ')
            .replace(/\* +\*\*(.+)\*\* +\*/g, ' > $1')
            .replace(/\s+/g, ' ')
            .trim();
        if (!text)
            return [];
        text = this.truncateAtMarkers(text);
        if (!text)
            return [];
        return [{
                text,
                isLowValue: this.isLowValueText(text)
            }];
    }
    cleanLanguageText(text) {
        return text
            .replace(/\b(?:public|private|protected|static|final|abstract|synchronized)\b/g, ' ')
            .replace(/\s*@\w+(?:\([^)]*\))?/g, ' ')
            .replace(/\s+throws\s+[\w.,\s]+$/g, '')
            .trim();
    }
    removeSignatureNoise(text, _languageId, _extension) {
        return text.replace(/^\((?:method|field|class)\)\s*/i, '');
    }
    getLanguageAliases(_languageId, _extension) {
        return ['java'];
    }
}
exports.JavaHoverHandler = JavaHoverHandler;
