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
var PuppeteerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppeteerService = void 0;
const common_1 = require("@nestjs/common");
const puppeteer = __importStar(require("puppeteer"));
let PuppeteerService = PuppeteerService_1 = class PuppeteerService {
    constructor() {
        this.logger = new common_1.Logger(PuppeteerService_1.name);
    }
    async generateCertificatePDF(data) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                ],
            });
            const page = await browser.newPage();
            // Set viewport size
            await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
            // Generate certificate HTML
            const html = this.generateCertificateHTML(data);
            // Set content
            await page.setContent(html, { waitUntil: 'networkidle0' });
            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px',
                },
            });
            return pdfBuffer;
        }
        catch (error) {
            this.logger.error('Failed to generate certificate PDF', error);
            throw error;
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    generateCertificateHTML(data) {
        const formattedDate = data.issuedAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const formattedDOB = data.dateOfBirth?.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate of Completion</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Open+Sans:wght@400;600&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Open Sans', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .certificate {
            background: white;
            width: 100%;
            max-width: 1200px;
            height: 800px;
            position: relative;
            border: 20px solid #f8f9fa;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
          }
          
          .certificate::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none" stroke="%23f0f0f0" stroke-width="1"/></svg>');
            opacity: 0.1;
            pointer-events: none;
          }
          
          .certificate-content {
            position: relative;
            z-index: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 60px 80px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .logo {
            font-size: 48px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
            font-family: 'Playfair Display', serif;
          }
          
          .tagline {
            font-size: 18px;
            color: #6b7280;
            font-style: italic;
          }
          
          .title {
            font-family: 'Playfair Display', serif;
            font-size: 48px;
            color: #1f2937;
            text-align: center;
            margin: 30px 0;
            font-weight: 700;
            letter-spacing: 2px;
          }
          
          .subtitle {
            font-size: 24px;
            color: #4b5563;
            text-align: center;
            margin-bottom: 40px;
            font-weight: 600;
          }
          
          .recipient {
            font-size: 36px;
            color: #1f2937;
            text-align: center;
            margin: 30px 0;
            font-weight: 600;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            min-width: 400px;
          }
          
          .course-info {
            text-align: center;
            margin: 30px 0;
            font-size: 20px;
            color: #4b5563;
            line-height: 1.6;
          }
          
          .course-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 24px;
            margin: 10px 0;
          }
          
          .career-path {
            color: #2563eb;
            font-weight: 600;
          }
          
          .duration {
            margin-top: 10px;
            font-style: italic;
          }
          
          .date-of-birth {
            margin-top: 20px;
            font-size: 18px;
            color: #6b7280;
          }
          
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            width: 100%;
            margin-top: 40px;
          }
          
          .date-section {
            text-align: center;
          }
          
          .date-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 5px;
          }
          
          .date-value {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
          }
          
          .signatures {
            display: flex;
            gap: 80px;
          }
          
          .signature {
            text-align: center;
          }
          
          .signature-line {
            width: 200px;
            height: 2px;
            background: #d1d5db;
            margin-bottom: 5px;
          }
          
          .signature-label {
            font-size: 14px;
            color: #6b7280;
          }
          
          .serial-number {
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 12px;
            color: #9ca3af;
            font-family: monospace;
          }
          
          .seal {
            position: absolute;
            bottom: 60px;
            right: 60px;
            width: 100px;
            height: 100px;
            border: 3px solid #2563eb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #2563eb;
            font-size: 14px;
            text-align: center;
            transform: rotate(-15deg);
          }
          
          .border-decoration {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 2px solid #e5e7eb;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="border-decoration"></div>
          <div class="certificate-content">
            <div class="header">
              <div class="logo">CareerHub</div>
              <div class="tagline">Empowering Careers Through Education</div>
            </div>
            
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">This is to certify that</div>
            
            <div class="recipient">${data.fullName}</div>
            
            <div class="course-info">
              has successfully completed the course
              <div class="course-name">${data.courseTitle}</div>
              in the <span class="career-path">${data.careerPath}</span> career path
              <div class="duration">Duration: ${data.courseDuration} hours</div>
              ${data.includeDateOfBirth && data.dateOfBirth ? `<div class="date-of-birth">Date of Birth: ${formattedDOB}</div>` : ''}
            </div>
            
            <div class="footer">
              <div class="date-section">
                <div class="date-label">Date of Issue</div>
                <div class="date-value">${formattedDate}</div>
              </div>
              
              <div class="signatures">
                <div class="signature">
                  <div class="signature-line"></div>
                  <div class="signature-label">Instructor</div>
                </div>
                <div class="signature">
                  <div class="signature-line"></div>
                  <div class="signature-label">Director</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="seal">
            OFFICIAL<br/>SEAL
          </div>
          
          <div class="serial-number">Serial: ${data.serialNumber}</div>
        </div>
      </body>
      </html>
    `;
    }
    async generateCertificatePreview(data) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
            await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
            const previewData = {
                ...data,
                serialNumber: 'PREVIEW-12345',
                courseDuration: 40,
                issuedAt: new Date(),
            };
            const html = this.generateCertificateHTML(previewData);
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: false,
                clip: { x: 0, y: 0, width: 800, height: 600 },
            });
            return `data:image/png;base64,${screenshot.toString('base64')}`;
        }
        catch (error) {
            this.logger.error('Failed to generate certificate preview', error);
            throw error;
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    async generateBulkCertificates(certificates) {
        const results = [];
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                ],
            });
            for (const certData of certificates) {
                try {
                    const page = await browser.newPage();
                    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
                    const html = this.generateCertificateHTML(certData);
                    await page.setContent(html, { waitUntil: 'networkidle0' });
                    const pdfBuffer = await page.pdf({
                        format: 'A4',
                        landscape: true,
                        printBackground: true,
                        margin: {
                            top: '20px',
                            right: '20px',
                            bottom: '20px',
                            left: '20px',
                        },
                    });
                    results.push({
                        serialNumber: certData.serialNumber,
                        pdfBuffer,
                    });
                    await page.close();
                }
                catch (error) {
                    this.logger.error(`Failed to generate certificate for ${certData.serialNumber}`, error);
                }
            }
            return results;
        }
        catch (error) {
            this.logger.error('Failed to generate bulk certificates', error);
            throw error;
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    async validateCertificateTemplate(template) {
        try {
            // Basic validation - check if template contains required placeholders
            const requiredPlaceholders = [
                '{{fullName}}',
                '{{courseTitle}}',
                '{{serialNumber}}',
                '{{issuedAt}}',
            ];
            for (const placeholder of requiredPlaceholders) {
                if (!template.includes(placeholder)) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            this.logger.error('Failed to validate certificate template', error);
            return false;
        }
    }
    async getCertificateDimensions() {
        return {
            width: 1200,
            height: 800,
        };
    }
    async testPuppeteerConnection() {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
            await page.goto('about:blank');
            return true;
        }
        catch (error) {
            this.logger.error('Puppeteer connection test failed', error);
            return false;
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
};
exports.PuppeteerService = PuppeteerService;
exports.PuppeteerService = PuppeteerService = PuppeteerService_1 = __decorate([
    (0, common_1.Injectable)()
], PuppeteerService);
