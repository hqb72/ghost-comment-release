"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    parseJava: function (contents) {
        const res = {
            text: "",
            source: "",
            isLowValue: true
        };
        if (!contents || contents.length < 3)
            return [res];
        res.text = String(contents[1]);
        if (!res.text || res.text.trim().length == 0)
            return [res];
        res.isLowValue = false;
        return [res];
    }
};
//# sourceMappingURL=ParseUtil.js.map