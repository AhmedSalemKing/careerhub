"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = sanitize;
const SENSITIVE_KEYS = /^(password|token|secret|key|authorization|credential|hash|refreshToken|accessToken)$/i;
function sanitize(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !SENSITIVE_KEYS.test(key)));
}
//# sourceMappingURL=sanitize.util.js.map