"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentDiagnosticService = exports.CommentDiagnosticService = void 0;
class CommentDiagnosticService {
    constructor() {
        this.diagnostics = new Map();
    }
    set(uriKey, line, reason, detail) {
        this.diagnostics.set(`${uriKey}:${line}`, {
            line,
            reason,
            detail,
            timestamp: Date.now()
        });
    }
    get(uriKey, line) {
        return this.diagnostics.get(`${uriKey}:${line}`);
    }
    clearByUri(uriKey) {
        const prefix = `${uriKey}:`;
        for (const key of this.diagnostics.keys()) {
            if (key.startsWith(prefix)) {
                this.diagnostics.delete(key);
            }
        }
    }
    clearAll() {
        this.diagnostics.clear();
    }
}
exports.CommentDiagnosticService = CommentDiagnosticService;
exports.commentDiagnosticService = new CommentDiagnosticService();
