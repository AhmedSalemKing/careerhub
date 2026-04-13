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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail').default || require('@sendgrid/mail');
let EmailService = class EmailService {
    constructor() {
        if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            console.log('[Email] SendGrid initialized ✅');
        }
        else {
            console.log('[Email] No SendGrid key — emails disabled');
        }
    }
    async send(to, subject, html) {
        if (!process.env.SENDGRID_API_KEY) {
            console.log('[Email] Would send to:', to, '|', subject);
            return;
        }
        try {
            await sgMail.send({
                to,
                from: { email: process.env.FROM_EMAIL || 'noreply@deveway.org', name: 'DeveWay' },
                subject,
                html,
            });
            console.log('[Email] Sent to:', to);
        }
        catch (err) {
            console.error('[Email] Failed:', err.message);
        }
    }
    template(title, body, ctaText, ctaUrl) {
        return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#1e293b,#0d0d0d);border:1px solid #1e3a5f;border-radius:16px 16px 0 0;padding:30px;text-align:center;">
      <h1 style="color:#3b82f6;font-size:28px;margin:0;">DeveWay</h1>
      <p style="color:#64748b;margin:5px 0 0;font-size:12px;">منصة التطوير المهني</p>
    </div>
    <div style="background:#111827;border:1px solid #1e293b;border-top:none;padding:40px 30px;">
      <h2 style="color:#f1f5f9;font-size:22px;margin:0 0 16px;text-align:right;">${title}</h2>
      <div style="color:#94a3b8;font-size:15px;line-height:1.8;text-align:right;">${body}</div>
      ${ctaText && ctaUrl ? `<div style="text-align:center;margin-top:32px;"><a href="${ctaUrl}" style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">${ctaText}</a></div>` : ''}
    </div>
    <div style="background:#0d1424;border:1px solid #1e293b;border-top:none;border-radius:0 0 16px 16px;padding:20px;text-align:center;">
      <p style="color:#475569;font-size:12px;margin:0;">© 2026 DeveWay — منصة التطوير المهني</p>
    </div>
  </div>
</body>
</html>`;
    }
    async sendWelcome(email, name) {
        await this.send(email, 'مرحباً بك في DeveWay! 🎉', this.template(`أهلاً وسهلاً يا ${name}`, `<p>يسعدنا انضمامك لمجتمع DeveWay — منصة التطوير المهني الأولى في المنطقة.</p><p>ابدأ رحلتك الآن باكتشاف مسارك المهني المناسب.</p>`, 'ابدأ رحلتك', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ar/dashboard/assessment`));
    }
    async sendApproval(email, name, role) {
        await this.send(email, 'تم قبول طلبك في DeveWay ✅', this.template(`تهانينا يا ${name}!`, `<p>يسعدنا إخبارك بأنه تم قبولك كـ<strong style="color:#3b82f6">${role === 'INSTRUCTOR' ? 'محاضر' : 'مستشار'}</strong> في منصة DeveWay.</p>`, 'تسجيل الدخول', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ar/login`));
    }
    async sendRejection(email, name, reason) {
        await this.send(email, 'نتيجة مراجعة طلبك في DeveWay', this.template(`عزيزي ${name}`, `<p>نأسف لإبلاغك بأنه تم رفض طلبك في الوقت الحالي.</p>${reason ? `<p>السبب: <strong style="color:#ef4444">${reason}</strong></p>` : ''}`));
    }
    async sendCourseApproved(email, name, courseTitle) {
        await this.send(email, `تم قبول كورسك "${courseTitle}" ✅`, this.template('تهانينا! كورسك منشور الآن', `<p>يا ${name}، تم قبول كورسك <strong style="color:#3b82f6">"${courseTitle}"</strong> وهو متاح الآن للطلاب.</p>`, 'عرض الكورسات', `${process.env.LEARN_URL || 'http://localhost:3002'}/ar/courses`));
    }
    async sendEnrollmentConfirm(email, name, courseTitle) {
        await this.send(email, `تم اشتراكك في "${courseTitle}" بنجاح 🎓`, this.template('ابدأ تعلمك الآن', `<p>يا ${name}، تم تسجيل اشتراكك في كورس <strong style="color:#3b82f6">"${courseTitle}"</strong> بنجاح.</p>`, 'ابدأ التعلم', `${process.env.LEARN_URL || 'http://localhost:3002'}/ar/my-courses`));
    }
    async sendCertificate(email, name, courseTitle, certUrl) {
        await this.send(email, `شهادتك جاهزة — ${courseTitle} 🏆`, this.template(`تهانينا يا ${name}!`, `<p>أتممت كورس <strong style="color:#f59e0b">"${courseTitle}"</strong> بنجاح! شهادتك المعتمدة جاهزة.</p>`, 'تحميل الشهادة', `${process.env.API_URL || 'http://localhost:3001'}${certUrl}`));
    }
    async sendSessionConfirmed(email, name, consultantName, date) {
        await this.send(email, 'تم تأكيد جلستك الاستشارية ✅', this.template(`جلستك مؤكدة يا ${name}`, `<p>تم تأكيد جلستك مع <strong style="color:#3b82f6">${consultantName}</strong>.</p><p>الموعد: <strong>${date.toLocaleString('ar-SA')}</strong></p>`, 'عرض الجلسة', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ar/dashboard/my-sessions`));
    }
    async sendSessionBooking(email, consultantName, studentName, topic) {
        await this.send(email, 'طلب استشارة جديد 📅', this.template(`طلب جديد يا ${consultantName}`, `<p>الطالب <strong style="color:#3b82f6">${studentName}</strong> يطلب استشارة.</p><p>الموضوع: <strong>${topic}</strong></p>`, 'عرض الطلب', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ar/dashboard/my-sessions`));
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
