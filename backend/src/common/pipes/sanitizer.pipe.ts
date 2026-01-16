import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';

/**
 * Sanitizer Pipe
 *
 * Cleans and sanitizes input data to prevent XSS and injection attacks.
 * - Trims whitespace from strings
 * - Removes potentially dangerous characters
 * - Validates data integrity
 */
@Injectable()
export class SanitizerPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    // Skip for non-body data
    if (metadata.type !== 'body') {
      return value;
    }

    try {
      // Sanitize object recursively
      const sanitized = this.sanitizeObject(value);

      // Validate if it's a DTO
      if (value.constructor.name !== 'Object') {
        const errors = await validate(sanitized);
        if (errors.length > 0) {
          throw new BadRequestException('Validation failed');
        }
      }

      return sanitized;
    } catch (error) {
      throw new BadRequestException('Invalid input data');
    }
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
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize string values
   * - Trim whitespace
   * - Remove null bytes
   * - Escape dangerous characters
   */
  private sanitizeString(str: string): string {
    // Trim whitespace
    let sanitized = str.trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove potentially dangerous script patterns (basic protection)
    // Note: This is a basic sanitization. For full XSS protection,
    // libraries like DOMPurify or validator.js should be used.
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers like onclick, onload, etc.
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    return sanitized;
  }
}
