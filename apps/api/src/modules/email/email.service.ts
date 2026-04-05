import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail').default || require('@sendgrid/mail');

@Injectable()
export class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log('[Email] SendGrid initialized ✅');
    } else {
      console.log('[Email] No SendGrid key — emails disabled');
    }
  }

  private async send(to: string, subject: string, html: string) {
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
    } catch (err: any) {
      console.error('[Email] Failed:', err.message);
    }
  }

  private template(title: string, body: string, ctaText?: string, ctaUrl?: string) {
    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid #1e3a5f;border-radius:16px 16px 0 0;padding:30px;text-align:center;">
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

  async sendWelcome(email: string, name: string) {
    await this.send(email, 'مرحباً بك في DeveWay! 🎉',
      this.template(`أهلاً وسهلاً يا ${name}`,
        `<p>يسعدنا انضمامك لمجتمع DeveWay — منصة التطوير المهني الأولى في المنطقة.</p><p>ابدأ رحلتك الآن باكتشاف مسارك المهني المناسب.</p>`,
        'ابدأ رحلتك', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ar/dashboard/assessment`));
  }

  async sendApproval(email: string, name: string, role: string) {
    await this.send(email, 'تم قبول طلبك في DeveWay ✅',
      this.template(`تهانينا يا ${name}!`,
        `<p>يسعدنا إخبارك بأنه تم قبولك كـ<strong style="color:#3b82f6">${role === 'INSTRUCTOR' ? 'محاضر' : 'مستشار'}</strong> في منصة DeveWay.</p>`,
        'تسجيل الدخول', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ar/login`));
  }

  async sendRejection(email: string, name: string, reason?: string) {
    await this.send(email, 'نتيجة مراجعة طلبك في DeveWay',
      this.template(`عزيزي ${name}`,
        `<p>نأسف لإبلاغك بأنه تم رفض طلبك في الوقت الحالي.</p>${reason ? `<p>السبب: <strong style="color:#ef4444">${reason}</strong></p>` : ''}`));
  }

  async sendCourseApproved(email: string, name: string, courseTitle: string) {
    await this.send(email, `تم قبول كورسك "${courseTitle}" ✅`,
      this.template('تهانينا! كورسك منشور الآن',
        `<p>يا ${name}، تم قبول كورسك <strong style="color:#3b82f6">"${courseTitle}"</strong> وهو متاح الآن للطلاب.</p>`,
        'عرض الكورسات', `${process.env.LEARN_URL || 'http://localhost:3002'}/ar/courses`));
  }

  async sendEnrollmentConfirm(email: string, name: string, courseTitle: string) {
    await this.send(email, `تم اشتراكك في "${courseTitle}" بنجاح 🎓`,
      this.template('ابدأ تعلمك الآن',
        `<p>يا ${name}، تم تسجيل اشتراكك في كورس <strong style="color:#3b82f6">"${courseTitle}"</strong> بنجاح.</p>`,
        'ابدأ التعلم', `${process.env.LEARN_URL || 'http://localhost:3002'}/ar/my-courses`));
  }

  async sendCertificate(email: string, name: string, courseTitle: string, certUrl: string) {
    await this.send(email, `شهادتك جاهزة — ${courseTitle} 🏆`,
      this.template(`تهانينا يا ${name}!`,
        `<p>أتممت كورس <strong style="color:#f59e0b">"${courseTitle}"</strong> بنجاح! شهادتك المعتمدة جاهزة.</p>`,
        'تحميل الشهادة', `${process.env.API_URL || 'http://localhost:3001'}${certUrl}`));
  }

  async sendSessionConfirmed(email: string, name: string, consultantName: string, date: Date) {
    await this.send(email, 'تم تأكيد جلستك الاستشارية ✅',
      this.template(`جلستك مؤكدة يا ${name}`,
        `<p>تم تأكيد جلستك مع <strong style="color:#3b82f6">${consultantName}</strong>.</p><p>الموعد: <strong>${date.toLocaleString('ar-SA')}</strong></p>`,
        'عرض الجلسة', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ar/dashboard/my-sessions`));
  }

  async sendSessionBooking(email: string, consultantName: string, studentName: string, topic: string) {
    await this.send(email, 'طلب استشارة جديد 📅',
      this.template(`طلب جديد يا ${consultantName}`,
        `<p>الطالب <strong style="color:#3b82f6">${studentName}</strong> يطلب استشارة.</p><p>الموضوع: <strong>${topic}</strong></p>`,
        'عرض الطلب', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ar/dashboard/my-sessions`));
  }
}
