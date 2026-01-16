import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * XSS Sanitizer Pipe
 *
 * Advanced XSS protection using express-xss-sanitizer.
 * Removes or encodes potentially dangerous HTML/JavaScript content.
 */
@Injectable()
export class XssSanitizerPipe implements PipeTransform<any> {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || metadata.type !== 'body') {
      return value;
    }

    return this.sanitizeObject(value);
  }

  /**
   * Recursively sanitize object properties
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[this.sanitizeString(key)] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize string to prevent XSS attacks
   * Uses HTML entity encoding
   */
  private sanitizeString(str: string): string {
    if (!str) return str;

    // HTML entity encoding map
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
    };

    // Encode HTML entities
    let sanitized = str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char]);

    // Remove common XSS patterns
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: protocol (except for safe images)
    sanitized = sanitized.replace(/data:(?!image\/(png|jpeg|jpg|gif|webp);base64)/gi, '');

    // Remove vbscript: protocol
    sanitized = sanitized.replace(/vbscript:/gi, '');

    // Remove on* event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=/gi, '');

    return sanitized;
  }
}
