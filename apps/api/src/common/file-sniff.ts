import { BadRequestException } from '@nestjs/common';

/**
 * Upload content validation. The MIME type and file name of a multipart upload are chosen by the client,
 * so they prove nothing. This checks the leading bytes of the buffer ("magic bytes") against the type
 * the client claimed, rejects script-capable formats (SVG, HTML, PHP ...) and unsafe name segments.
 */

type Kind = 'pdf' | 'jpeg' | 'png' | 'gif' | 'webp' | 'ole' | 'zip' | 'mp4' | 'webm' | 'text';

/** Claimed MIME type -> the real content kinds that are acceptable for it. Anything not listed is rejected. */
const MIME_KINDS: Record<string, Kind[]> = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  'application/msword': ['ole'],
  'application/vnd.ms-excel': ['ole'],
  'application/vnd.ms-powerpoint': ['ole'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['zip'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['zip'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['zip'],
  'application/zip': ['zip'],
  'text/plain': ['text'],
  'video/mp4': ['mp4'],
  'video/quicktime': ['mp4'],
  'video/webm': ['webm'],
};

/** Any dot-separated segment of the file name matching one of these is refused ("shell.php.pdf" included). */
const BLOCKED_EXTENSIONS = new Set([
  'svg', 'svgz', 'html', 'htm', 'xhtml', 'shtml', 'xml', 'js', 'mjs', 'php', 'php3', 'php4', 'php5', 'php7',
  'phtml', 'phar', 'asp', 'aspx', 'jsp', 'jspx', 'cgi', 'pl', 'py', 'rb', 'sh', 'bash', 'exe', 'dll', 'bat',
  'cmd', 'com', 'msi', 'scr', 'jar', 'htaccess',
]);

const startsWith = (buf: Buffer, bytes: number[], offset = 0) =>
  buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);

function detectKind(buf: Buffer): Kind | null {
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return 'pdf'; // %PDF
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) return 'gif'; // GIF8
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'ole'; // legacy Office
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buf, [0x50, 0x4b, 0x05, 0x06])) return 'zip'; // zip / OOXML
  if (startsWith(buf, [0x66, 0x74, 0x79, 0x70], 4)) return 'mp4'; // ....ftyp (mp4 / mov)
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return 'webm'; // EBML
  // Plain text: no NUL bytes and nothing that looks like markup or a script
  const head = buf.subarray(0, 4096);
  if (!head.includes(0)) {
    const text = head.toString('utf8').toLowerCase();
    if (!/<\?php|<\?=|<script|<svg|<html|<!doctype/.test(text)) return 'text';
  }
  return null;
}

/** Throws BadRequestException unless the uploaded buffer really is what the client says it is. */
export function assertFileMatchesDeclaredType(file: Express.Multer.File | undefined | null, allowedMimes?: string[]): void {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new BadRequestException('No file provided');
  }

  const declared = (file.mimetype || '').toLowerCase();
  if (allowedMimes && !allowedMimes.includes(declared)) {
    throw new BadRequestException('File type not allowed');
  }

  const segments = String(file.originalname || '').toLowerCase().split('.').slice(1);
  if (segments.some((s) => BLOCKED_EXTENSIONS.has(s.trim()))) {
    throw new BadRequestException('File type not allowed');
  }

  const accepted = MIME_KINDS[declared];
  const actual = detectKind(file.buffer);
  if (!accepted || !actual || !accepted.includes(actual)) {
    throw new BadRequestException('File content does not match its declared type');
  }
}

/** File extension (with dot) derived from the verified MIME type, never from the client's file name. */
export const SAFE_EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',
  'application/zip': '.zip',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};
