"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = sanitize;
const SENSITIVE_KEYS = /^(password|token|secret|key|authorization|credential|hash|refreshToken|accessToken)$/i;
/**
 * Removes sensitive fields from an object before logging.
 * Keys matching the SENSITIVE_KEYS pattern are redacted.
 */
function sanitize(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !SENSITIVE_KEYS.test(key)));
}
