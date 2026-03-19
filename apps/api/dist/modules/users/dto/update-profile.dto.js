"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UpdateProfileDto {
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'First name',
        example: 'John',
        minLength: 2,
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'First name must be a string' }),
    (0, class_validator_1.MinLength)(2, { message: 'First name must be at least 2 characters long' }),
    (0, class_validator_1.MaxLength)(50, { message: 'First name cannot exceed 50 characters' }),
    (0, class_validator_1.Matches)(/^[a-zA-Z\u0600-\u06FF\s]+$/, {
        message: 'First name can only contain letters and spaces',
    }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Last name',
        example: 'Doe',
        minLength: 2,
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Last name must be a string' }),
    (0, class_validator_1.MinLength)(2, { message: 'Last name must be at least 2 characters long' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Last name cannot exceed 50 characters' }),
    (0, class_validator_1.Matches)(/^[a-zA-Z\u0600-\u06FF\s]+$/, {
        message: 'Last name can only contain letters and spaces',
    }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Phone number',
        example: '+201234567890',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Phone number must be a string' }),
    (0, class_validator_1.Matches)(/^\+?[1-9]\d{1,14}$/, {
        message: 'Please provide a valid phone number with country code',
    }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date of birth',
        example: '1990-01-01',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Please provide a valid date of birth' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Gender',
        example: 'MALE',
        enum: client_1.Gender,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Gender, { message: 'Gender must be MALE, FEMALE, or OTHER' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nationality',
        example: 'Egyptian',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Nationality must be a string' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Nationality cannot exceed 50 characters' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "nationality", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Country',
        example: 'Egypt',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Country must be a string' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Country cannot exceed 50 characters' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'City',
        example: 'Cairo',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'City must be a string' }),
    (0, class_validator_1.MaxLength)(50, { message: 'City cannot exceed 50 characters' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Bio',
        example: 'Passionate learner and tech enthusiast',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Bio must be a string' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Bio cannot exceed 500 characters' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'LinkedIn profile URL',
        example: 'https://linkedin.com/in/johndoe',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'Please provide a valid LinkedIn URL' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "linkedinUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preferred language',
        example: 'en',
        enum: ['en', 'ar'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Language must be a string' }),
    (0, class_validator_1.Matches)(/^(en|ar)$/, { message: 'Language must be either "en" or "ar"' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Timezone',
        example: 'Africa/Cairo',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Timezone must be a string' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Timezone cannot exceed 50 characters' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "timezone", void 0);
