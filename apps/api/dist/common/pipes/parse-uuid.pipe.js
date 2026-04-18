"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseOptionalUUIDPipe = exports.ParseUUIDPipe = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let ParseUUIDPipe = class ParseUUIDPipe {
    transform(value, metadata) {
        if (!value) {
            throw new common_1.BadRequestException(`${metadata.data} is required`);
        }
        if (!(0, uuid_1.validate)(value)) {
            throw new common_1.BadRequestException(`${metadata.data} must be a valid UUID`);
        }
        return value;
    }
};
exports.ParseUUIDPipe = ParseUUIDPipe;
exports.ParseUUIDPipe = ParseUUIDPipe = __decorate([
    (0, common_1.Injectable)()
], ParseUUIDPipe);
let ParseOptionalUUIDPipe = class ParseOptionalUUIDPipe {
    transform(value, metadata) {
        if (!value) {
            return undefined;
        }
        if (!(0, uuid_1.validate)(value)) {
            throw new common_1.BadRequestException(`${metadata.data} must be a valid UUID`);
        }
        return value;
    }
};
exports.ParseOptionalUUIDPipe = ParseOptionalUUIDPipe;
exports.ParseOptionalUUIDPipe = ParseOptionalUUIDPipe = __decorate([
    (0, common_1.Injectable)()
], ParseOptionalUUIDPipe);
//# sourceMappingURL=parse-uuid.pipe.js.map