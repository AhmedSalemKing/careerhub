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
exports.ValidationUtil = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const validator = __importStar(require("validator"));
class ValidationUtil {
    static isValidUUID(id) {
        return (0, uuid_1.validate)(id);
    }
    static requireValidUUID(id, fieldName = 'ID') {
        if (!id) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        if (!this.isValidUUID(id)) {
            throw new common_1.BadRequestException(`${fieldName} must be a valid UUID`);
        }
    }
    static isValidEmail(email) {
        return validator.isEmail(email);
    }
    static requireValidEmail(email) {
        if (!email) {
            throw new common_1.BadRequestException('Email is required');
        }
        if (!this.isValidEmail(email)) {
            throw new common_1.BadRequestException('Invalid email format');
        }
    }
    static isValidPassword(password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }
    static requireValidPassword(password) {
        if (!password) {
            throw new common_1.BadRequestException('Password is required');
        }
        if (!this.isValidPassword(password)) {
            throw new common_1.BadRequestException('Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character');
        }
    }
    static isValidPhoneNumber(phone, countryCode) {
        if (countryCode) {
            return validator.isMobilePhone(phone, countryCode);
        }
        return validator.isMobilePhone(phone, 'any');
    }
    static requireValidPhoneNumber(phone, countryCode) {
        if (!phone) {
            throw new common_1.BadRequestException('Phone number is required');
        }
        if (!this.isValidPhoneNumber(phone, countryCode)) {
            throw new common_1.BadRequestException('Invalid phone number format');
        }
    }
    static isValidUrl(url) {
        return validator.isURL(url, {
            protocols: ['http', 'https'],
            require_protocol: true,
        });
    }
    static requireValidUrl(url, fieldName = 'URL') {
        if (!url) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        if (!this.isValidUrl(url)) {
            throw new common_1.BadRequestException(`Invalid ${fieldName} format`);
        }
    }
    static isValidDate(date) {
        return validator.isISO8601(date, { strict: true });
    }
    static requireValidDate(date, fieldName = 'Date') {
        if (!date) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        if (!this.isValidDate(date)) {
            throw new common_1.BadRequestException(`Invalid ${fieldName} format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)`);
        }
    }
    static isValidSlug(slug) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        return slugRegex.test(slug);
    }
    static requireValidSlug(slug, fieldName = 'Slug') {
        if (!slug) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        if (!this.isValidSlug(slug)) {
            throw new common_1.BadRequestException(`Invalid ${fieldName} format. Use lowercase letters, numbers, and hyphens only`);
        }
    }
    static sanitizeString(input) {
        return validator.escape(input.trim());
    }
    static sanitizeHtml(input) {
        return validator.escape(input);
    }
    static isValidPrice(price) {
        return price >= 0 && Number.isFinite(price);
    }
    static requireValidPrice(price, fieldName = 'Price') {
        if (price === null || price === undefined) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        if (!this.isValidPrice(price)) {
            throw new common_1.BadRequestException(`${fieldName} must be a valid positive number`);
        }
    }
    static isValidRating(rating) {
        return rating >= 0 && rating <= 5 && Number.isFinite(rating);
    }
    static requireValidRating(rating, fieldName = 'Rating') {
        if (rating === null || rating === undefined) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        if (!this.isValidRating(rating)) {
            throw new common_1.BadRequestException(`${fieldName} must be between 0 and 5`);
        }
    }
    static isValidPercentage(value) {
        return value >= 0 && value <= 100 && Number.isFinite(value);
    }
    static requireValidPercentage(value, fieldName = 'Percentage') {
        if (value === null || value === undefined) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        if (!this.isValidPercentage(value)) {
            throw new common_1.BadRequestException(`${fieldName} must be between 0 and 100`);
        }
    }
    static isValidLanguageCode(code) {
        return validator.isISO31661Alpha2(code) || validator.isISO31661Alpha3(code);
    }
    static requireValidLanguageCode(code, fieldName = 'Language code') {
        if (!code) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        if (!this.isValidLanguageCode(code)) {
            throw new common_1.BadRequestException(`Invalid ${fieldName} format. Use ISO 3166-1 alpha-2 or alpha-3 codes`);
        }
    }
    static isValidCurrencyCode(code) {
        return validator.isISO4217(code);
    }
    static requireValidCurrencyCode(code, fieldName = 'Currency code') {
        if (!code) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        if (!this.isValidCurrencyCode(code)) {
            throw new common_1.BadRequestException(`Invalid ${fieldName} format. Use ISO 4217 currency codes`);
        }
    }
    static generateSlug(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    static extractTextFromHtml(html) {
        return html.replace(/<[^>]*>/g, '').trim();
    }
    static truncateText(text, maxLength, suffix = '...') {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - suffix.length) + suffix;
    }
    static isValidJson(json) {
        try {
            JSON.parse(json);
            return true;
        }
        catch {
            return false;
        }
    }
    static requireValidJson(json, fieldName = 'JSON') {
        if (!json) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        if (!this.isValidJson(json)) {
            throw new common_1.BadRequestException(`Invalid ${fieldName} format`);
        }
    }
}
exports.ValidationUtil = ValidationUtil;
//# sourceMappingURL=validation.util.js.map