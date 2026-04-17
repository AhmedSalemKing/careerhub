export declare class PuppeteerService {
    private readonly logger;
    generateCertificatePDF(data: {
        serialNumber: string;
        fullName: string;
        courseTitle: string;
        courseDuration: number;
        careerPath: string;
        issuedAt: Date;
        includeDateOfBirth?: boolean;
        dateOfBirth?: Date;
    }): Promise<Buffer>;
    private generateCertificateHTML;
    generateCertificatePreview(data: {
        fullName: string;
        courseTitle: string;
        careerPath: string;
    }): Promise<string>;
    generateBulkCertificates(certificates: Array<{
        serialNumber: string;
        fullName: string;
        courseTitle: string;
        courseDuration: number;
        careerPath: string;
        issuedAt: Date;
    }>): Promise<Array<{
        serialNumber: string;
        pdfBuffer: Buffer;
    }>>;
    validateCertificateTemplate(template: string): Promise<boolean>;
    getCertificateDimensions(): Promise<{
        width: number;
        height: number;
    }>;
    testPuppeteerConnection(): Promise<boolean>;
}
