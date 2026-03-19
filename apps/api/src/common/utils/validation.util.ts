import { BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';
import * as validator from 'validator';

export class ValidationUtil {
  static isValidUUID(id: string): boolean {
    return isUUID(id);
  }

  static requireValidUUID(id: string, fieldName: string = 'ID'): void {
    if (!id) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.isValidUUID(id)) {
      throw new BadRequestException(`${fieldName} must be a valid UUID`);
    }
  }

  static isValidEmail(email: string): boolean {
    return validator.isEmail(email);
  }

  static requireValidEmail(email: string): void {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  static isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static requireValidPassword(password: string): void {
    if (!password) {
      throw new BadRequestException('Password is required');
    }
    if (!this.isValidPassword(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
      );
    }
  }

  static isValidPhoneNumber(phone: string, countryCode?: string): boolean {
    if (countryCode) {
      return validator.isMobilePhone(phone, countryCode as any);
    }
    return validator.isMobilePhone(phone, 'any');
  }

  static requireValidPhoneNumber(phone: string, countryCode?: string): void {
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }
    if (!this.isValidPhoneNumber(phone, countryCode)) {
      throw new BadRequestException('Invalid phone number format');
    }
  }

  static isValidUrl(url: string): boolean {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
    });
  }

  static requireValidUrl(url: string, fieldName: string = 'URL'): void {
    if (!url) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.isValidUrl(url)) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
  }

  static isValidDate(date: string): boolean {
    return validator.isISO8601(date, { strict: true });
  }

  static requireValidDate(date: string, fieldName: string = 'Date'): void {
    if (!date) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.isValidDate(date)) {
      throw new BadRequestException(`Invalid ${fieldName} format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)`);
    }
  }

  static isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  }

  static requireValidSlug(slug: string, fieldName: string = 'Slug'): void {
    if (!slug) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.isValidSlug(slug)) {
      throw new BadRequestException(`Invalid ${fieldName} format. Use lowercase letters, numbers, and hyphens only`);
    }
  }

  static sanitizeString(input: string): string {
    return validator.escape(input.trim());
  }

  static sanitizeHtml(input: string): string {
    return validator.escape(input);
  }

  static isValidPrice(price: number): boolean {
    return price >= 0 && Number.isFinite(price);
  }

  static requireValidPrice(price: number, fieldName: string = 'Price'): void {
    if (price === null || price === undefined) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.isValidPrice(price)) {
      throw new BadRequestException(`${fieldName} must be a valid positive number`);
    }
  }

  static isValidRating(rating: number): boolean {
    return rating >= 0 && rating <= 5 && Number.isFinite(rating);
  }

  static requireValidRating(rating: number, fieldName: string = 'Rating'): void {
    if (rating === null || rating === undefined) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.isValidRating(rating)) {
      throw new BadRequestException(`${fieldName} must be between 0 and 5`);
    }
  }

  static isValidPercentage(value: number): boolean {
    return value >= 0 && value <= 100 && Number.isFinite(value);
  }

  static requireValidPercentage(value: number, fieldName: string = 'Percentage'): void {
    if (value === null || value === undefined) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.isValidPercentage(value)) {
      throw new BadRequestException(`${fieldName} must be between 0 and 100`);
    }
  }

  static isValidLanguageCode(code: string): boolean {
    return validator.isISO31661Alpha2(code) || validator.isISO31661Alpha3(code);
  }

  static requireValidLanguageCode(code: string, fieldName: string = 'Language code'): void {
    if (!code) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.isValidLanguageCode(code)) {
      throw new BadRequestException(`Invalid ${fieldName} format. Use ISO 3166-1 alpha-2 or alpha-3 codes`);
    }
  }

  static isValidCurrencyCode(code: string): boolean {
    return validator.isISO4217(code);
  }

  static requireValidCurrencyCode(code: string, fieldName: string = 'Currency code'): void {
    if (!code) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.isValidCurrencyCode(code)) {
      throw new BadRequestException(`Invalid ${fieldName} format. Use ISO 4217 currency codes`);
    }
  }

  static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  static extractTextFromHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  static isValidJson(json: string): boolean {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }

  static requireValidJson(json: string, fieldName: string = 'JSON'): void {
    if (!json) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.isValidJson(json)) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
  }
}
