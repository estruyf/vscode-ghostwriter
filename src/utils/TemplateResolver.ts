export interface TemplateResolverContext {
  fileName?: string;
  title?: string;
  slug?: string;
  date?: Date;
}

export class TemplateResolver {
  static resolveTemplate(
    template: string,
    context: TemplateResolverContext = {},
  ): string {
    if (!template) {
      return "";
    }

    const date = context.date || new Date();
    const title = this.sanitizeTitle(context.title || context.fileName || "");
    const slug = context.slug || this.sanitizeSlug(title || "untitled");
    const fileName = this.sanitizeTitle(
      context.fileName || title || "untitled",
    );

    let resolved = template;

    resolved = resolved.replace(
      /\{\{date(?:\|([^}]+))?\}\}/g,
      (_match, format) => {
        const safeFormat = String(format || "yyyy-MM-dd");
        return this.formatDate(date, safeFormat);
      },
    );

    resolved = resolved.replace(/\{\{year\}\}/g, date.getFullYear().toString());
    resolved = resolved.replace(
      /\{\{month\}\}/g,
      String(date.getMonth() + 1).padStart(2, "0"),
    );
    resolved = resolved.replace(
      /\{\{day\}\}/g,
      String(date.getDate()).padStart(2, "0"),
    );

    resolved = resolved.replace(/\{\{fileName\}\}/g, fileName);
    resolved = resolved.replace(/\{\{title\}\}/g, title || fileName);
    resolved = resolved.replace(/\{\{slug\}\}/g, slug);

    return resolved;
  }

  static sanitizeSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private static sanitizeTitle(value: string): string {
    return value
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private static formatDate(date: Date, format: string): string {
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return format
      .replace(/yyyy/g, year)
      .replace(/MM/g, month)
      .replace(/dd/g, day);
  }
}
