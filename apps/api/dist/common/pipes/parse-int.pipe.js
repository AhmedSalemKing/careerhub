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
exports.ParseOptionalIntPipe = exports.ParsePositiveIntPipe = exports.ParseIntPipe = void 0;
const common_1 = require("@nestjs/common");
let ParseIntPipe = class ParseIntPipe {
    constructor(options) {
        this.options = options;
    }
    transform(value, metadata) {
        var _a, _b, _c;
        if (!value && ((_a = this.options) === null || _a === void 0 ? void 0 : _a.optional)) {
            return undefined;
        }
        if (!value) {
            throw new common_1.BadRequestException(`${metadata.data} is required`);
        }
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue)) {
            throw new common_1.BadRequestException(`${metadata.data} must be a valid integer`);
        }
        if (((_b = this.options) === null || _b === void 0 ? void 0 : _b.min) !== undefined && parsedValue < this.options.min) {
            throw new common_1.BadRequestException(`${metadata.data} must be at least ${this.options.min}`);
        }
        if (((_c = this.options) === null || _c === void 0 ? void 0 : _c.max) !== undefined && parsedValue > this.options.max) {
            throw new common_1.BadRequestException(`${metadata.data} must be at most ${this.options.max}`);
        }
        return parsedValue;
    }
};
exports.ParseIntPipe = ParseIntPipe;
exports.ParseIntPipe = ParseIntPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], ParseIntPipe);
let ParsePositiveIntPipe = class ParsePositiveIntPipe extends ParseIntPipe {
    constructor() {
        super({ min: 1 });
    }
};
exports.ParsePositiveIntPipe = ParsePositiveIntPipe;
exports.ParsePositiveIntPipe = ParsePositiveIntPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ParsePositiveIntPipe);
let ParseOptionalIntPipe = class ParseOptionalIntPipe extends ParseIntPipe {
    constructor(options) {
        super({ ...options, optional: true });
    }
};
exports.ParseOptionalIntPipe = ParseOptionalIntPipe;
exports.ParseOptionalIntPipe = ParseOptionalIntPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], ParseOptionalIntPipe);
//# sourceMappingURL=parse-int.pipe.js.map