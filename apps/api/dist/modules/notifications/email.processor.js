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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sgMail = __importStar(require("@sendgrid/mail"));
const email_types_1 = require("./email.types");
function renderTemplate(template, context) {
    const templateDir = path.join(__dirname, 'templates');
    const filePath = path.join(templateDir, `${template}.html`);
    let html;
    try {
        html = fs.readFileSync(filePath, 'utf8');
    }
    catch {
        return Object.entries(context)
            .reduce((acc, [k, v]) => acc + `<p>${k}: ${v}</p>`, '<html><body>') + '</body></html>';
    }
    return Object.entries(context).reduce((result, [key, value]) => result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), value), html);
}
let EmailProcessor = EmailProcessor_1 = class EmailProcessor {
    constructor() {
        this.logger = new common_1.Logger(EmailProcessor_1.name);
    }
    async processEmail(job) {
        const { to, template, context } = job.data;
        const fromEmail = process.env.FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@careerhub.com';
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            this.logger.warn('SENDGRID_API_KEY not set — skipping email delivery', { template, to });
            return;
        }
        sgMail.setApiKey(apiKey);
        try {
            await sgMail.send({
                to,
                from: fromEmail,
                subject: email_types_1.EMAIL_SUBJECTS[template],
                html: renderTemplate(template, context),
            });
            this.logger.log('Email delivered', { template, to });
        }
        catch (e) {
            this.logger.error('Email delivery failed', {
                template,
                to,
                attempt: job.attemptsMade,
                error: e.message,
            });
            throw e;
        }
    }
};
exports.EmailProcessor = EmailProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "processEmail", null);
exports.EmailProcessor = EmailProcessor = EmailProcessor_1 = __decorate([
    (0, bull_1.Processor)('email')
], EmailProcessor);
//# sourceMappingURL=email.processor.js.map