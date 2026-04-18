"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiFilter = exports.ApiDateRange = exports.ApiSort = exports.ApiSearch = exports.ApiPagination = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ApiPagination = () => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number (default: 1)',
        example: 1,
    }), (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Items per page (default: 20, max: 100)',
        example: 20,
    }));
};
exports.ApiPagination = ApiPagination;
const ApiSearch = () => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Search query',
        example: 'javascript',
    }));
};
exports.ApiSearch = ApiSearch;
const ApiSort = () => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiQuery)({
        name: 'sortBy',
        required: false,
        type: String,
        description: 'Field to sort by',
        example: 'createdAt',
    }), (0, swagger_1.ApiQuery)({
        name: 'sortOrder',
        required: false,
        enum: ['asc', 'desc'],
        description: 'Sort order (default: desc)',
        example: 'desc',
    }));
};
exports.ApiSort = ApiSort;
const ApiDateRange = () => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiQuery)({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Start date (YYYY-MM-DD)',
        example: '2024-01-01',
    }), (0, swagger_1.ApiQuery)({
        name: 'endDate',
        required: false,
        type: String,
        description: 'End date (YYYY-MM-DD)',
        example: '2024-12-31',
    }));
};
exports.ApiDateRange = ApiDateRange;
const ApiFilter = (fieldName, description, enumValues) => {
    return (0, swagger_1.ApiQuery)({
        name: fieldName,
        required: false,
        enum: enumValues,
        description,
    });
};
exports.ApiFilter = ApiFilter;
//# sourceMappingURL=pagination.decorator.js.map