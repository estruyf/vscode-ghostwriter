/**
 * TemplateService - Handles placeholder resolution and template formatting
 * Supports variables like {{fileName}}, {{date|format}}, {{year}}, {{month}}, {{day}}
 */

export interface TemplateContext {
  fileName?: string; // Base filename without extension
  transcript?: string; // Transcript content for text analysis
  date?: Date; // Current date (defaults to now)
  [key: string]: any; // Support custom variables
}

export class TemplateService {
  /**
   * Parse and resolve template string with placeholders
   * @param template Template string with {{}} placeholders
   * @param context Variables to replace in template
   * @returns Resolved template string
   */
  static resolveTemplate(template: string, context: TemplateContext): string {
    if (!template) {
      return "";
    }

    const date = context.date || new Date();
    let resolved = template;

    // Replace date-based placeholders with format support: {{date|format}}
    resolved = this.replaceDatePlaceholders(resolved, date);

    // Replace simple date component placeholders
    resolved = resolved.replace(/\{\{year\}\}/g, date.getFullYear().toString());
    resolved = resolved.replace(
      /\{\{month\}\}/g,
      String(date.getMonth() + 1).padStart(2, "0"),
    );
    resolved = resolved.replace(
      /\{\{day\}\}/g,
      String(date.getDate()).padStart(2, "0"),
    );

    // Replace fileName if provided
    if (context.fileName) {
      resolved = resolved.replace(/\{\{fileName\}\}/g, context.fileName);
    }

    // Replace any custom context variables
    Object.entries(context).forEach(([key, value]) => {
      if (
        key !== "date" &&
        key !== "fileName" &&
        value !== undefined &&
        value !== null
      ) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        resolved = resolved.replace(placeholder, String(value));
      }
    });

    return resolved;
  }

  /**
   * Replace date placeholders with format support
   * Supports formats like: {{date|yyyy-MM-dd}}, {{date|yyyy-MM}}, etc.
   * Format tokens:
   *   yyyy = 4-digit year
   *   MM = 2-digit month (01-12)
   *   dd = 2-digit day (01-31)
   *   HH = 2-digit hour (00-23)
   *   mm = 2-digit minute (00-59)
   *   ss = 2-digit second (00-59)
   */
  private static replaceDatePlaceholders(template: string, date: Date): string {
    // Match {{date|format}} or {{date}}
    const regex = /\{\{date(?:\|([^\}]+))?\}\}/g;

    return template.replace(regex, (match, format) => {
      if (!format) {
        // Default format: yyyy-MM-dd
        format = "yyyy-MM-dd";
      }
      return this.formatDate(date, format as string);
    });
  }

  /**
   * Format a date according to the specified format string
   */
  private static formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return format
      .replace(/yyyy/g, year.toString())
      .replace(/MM/g, month)
      .replace(/dd/g, day)
      .replace(/HH/g, hours)
      .replace(/mm/g, minutes)
      .replace(/ss/g, seconds);
  }

  /**
   * Validate a template string for valid placeholders
   * @param template Template string to validate
   * @returns Array of error messages (empty if valid)
   */
  static validateTemplate(template: string): string[] {
    const errors: string[] = [];

    if (!template || template.trim().length === 0) {
      errors.push("Template cannot be empty");
      return errors;
    }

    // Check for unclosed braces
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push("Mismatched braces in template");
    }

    // Check for invalid date formats
    const dateRegex = /\{\{date\|([^\}]+)\}\}/g;
    let match;
    while ((match = dateRegex.exec(template)) !== null) {
      const format = match[1];
      // Basic validation: format should only contain yyyy, MM, dd, HH, mm, ss, and allowed separators
      if (!/^[yMdHms\-:\/ ]+$/.test(format)) {
        errors.push(
          `Invalid date format: ${format}. Use yyyy, MM, dd, HH, mm, ss with separators like -, :, /, or space.`,
        );
      }
    }

    return errors;
  }

  /**
   * Extract fileName from a file path (without extension)
   */
  static extractFileName(filePath: string): string {
    const filename =
      filePath.split("/").pop() || filePath.split("\\").pop() || "";
    return filename.replace(/\.[^/.]+$/, ""); // Remove extension
  }

  /**
   * Generate a preview of the template with sample data
   */
  static generatePreview(
    template: string,
    context?: Partial<TemplateContext>,
  ): string {
    const defaultContext: TemplateContext = {
      fileName: context?.fileName || "my-article",
      date: context?.date || new Date(),
    };

    return this.resolveTemplate(template, defaultContext);
  }
}
