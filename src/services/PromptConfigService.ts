import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";
import { PROMPTS } from "../constants";

export interface PromptConfig {
  id: string;
  name: string;
  description: string;
  domain: string;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface PromptConfigInput {
  name: string;
  description: string;
  domain: string;
  systemPrompt: string;
  tags?: string[];
}

export class PromptConfigService {
  private static context: vscode.ExtensionContext;
  private static readonly STATE_KEY = "ghostwriter.promptConfigs";
  private static readonly PRESETS = {
    general_writer: {
      name: "General Writer",
      description: "Standard comprehensive writing assistant",
      domain: "general",
      systemPrompt: PROMPTS.WRITER,
    },
    strategy_docs: {
      name: "Strategy Documents",
      description: "For strategic planning and business strategy documentation",
      domain: "strategy",
      systemPrompt: `You are an expert strategy consultant helping to create clear, compelling strategy documents.

Your role is to take raw interview content and transform it into a well-structured strategy document that:
- Clearly articulates the vision and goals
- Outlines key initiatives and their rationale
- Identifies success metrics and milestones
- Provides actionable recommendations
- Maintains a professional, executive-level tone

Focus on clarity, logical flow, and strategic alignment. Use headers, bullet points, and clear sections.`,
    },
    specs: {
      name: "Technical Specifications",
      description: "For technical specifications and requirements documents",
      domain: "technical_specs",
      systemPrompt: `You are an expert technical writer specializing in specifications and requirements documentation.

Transform the interview content into a comprehensive technical specification that:
- Clearly defines requirements and constraints
- Includes detailed technical descriptions
- Provides examples and use cases
- Outlines edge cases and error handling
- Uses precise technical terminology
- Includes diagrams/ASCII art where helpful

Maintain a technical yet accessible tone for stakeholders at all levels.`,
    },
    blog_posts: {
      name: "Blog Posts",
      description: "For technical and editorial blog content",
      domain: "blog",
      systemPrompt: `You are an engaging technical writer creating compelling blog posts.

Transform the interview content into a blog post that:
- Opens with a compelling hook
- Clearly establishes the problem being solved
- Guides readers through the solution step-by-step
- Includes code examples, screenshots, or visuals where relevant
- Concludes with actionable takeaways
- Uses a conversational yet authoritative tone
- Includes SEO-friendly headers and structure

Make it scannable with good formatting and clear sections.`,
    },
    internal_comms: {
      name: "Internal Communications",
      description:
        "For internal announcements, launch emails, and team updates",
      domain: "internal_comms",
      systemPrompt: `You are an expert internal communications specialist.

Transform the interview content into clear internal communications that:
- Start with the key message upfront
- Explain the "why" and impact for the organization
- Include practical next steps and calls to action
- Use an approachable, inclusive tone
- Address potential concerns
- Keep messages concise but comprehensive

Focus on clarity, transparency, and employee engagement.`,
    },
    tutorials: {
      name: "Tutorials & How-To Guides",
      description: "For step-by-step tutorials and instructional content",
      domain: "tutorials",
      systemPrompt: `You are an expert technical educator creating clear, learner-friendly tutorials.

Transform the interview content into a tutorial that:
- Starts with prerequisites and learning objectives
- Breaks concepts into digestible steps
- Includes practical, runnable examples
- Provides explanations of the "why" not just the "how"
- Includes troubleshooting tips
- Ends with next steps for deeper learning
- Uses clear, beginner-friendly language while respecting the reader's intelligence

Make it easy to follow and reference.`,
    },
  };

  public static initialize(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Get all prompt configurations (including presets)
   */
  public static getAll(): PromptConfig[] {
    const configs =
      this.context.workspaceState.get<PromptConfig[]>(this.STATE_KEY) || [];

    // Add presets that don't override existing configs
    const presetConfigs = Object.entries(this.PRESETS).map(([key, preset]) => ({
      id: `preset_${key}`,
      createdAt: 0,
      updatedAt: 0,
      ...preset,
    }));

    // Filter out presets that have been overridden by user configs
    const overriddenIds = new Set(configs.map((c) => c.id));
    const uniquePresets = presetConfigs.filter((p) => !overriddenIds.has(p.id));

    return [...configs, ...uniquePresets].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  }

  /**
   * Get a specific prompt configuration by ID
   */
  public static getById(id: string): PromptConfig | undefined {
    const all = this.getAll();
    return all.find((config) => config.id === id);
  }

  /**
   * Create a new prompt configuration
   */
  public static async create(input: PromptConfigInput): Promise<PromptConfig> {
    const now = Date.now();
    const config: PromptConfig = {
      id: uuidv4(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    const configs =
      this.context.workspaceState.get<PromptConfig[]>(this.STATE_KEY) || [];
    configs.push(config);

    await this.context.workspaceState.update(this.STATE_KEY, configs);
    return config;
  }

  /**
   * Update an existing prompt configuration
   */
  public static async update(
    id: string,
    input: Partial<PromptConfigInput>,
  ): Promise<PromptConfig | undefined> {
    const configs =
      this.context.workspaceState.get<PromptConfig[]>(this.STATE_KEY) || [];
    const index = configs.findIndex((c) => c.id === id);

    if (index === -1) {
      return undefined;
    }

    const updatedConfig: PromptConfig = {
      ...configs[index],
      ...input,
      updatedAt: Date.now(),
    };

    configs[index] = updatedConfig;
    await this.context.workspaceState.update(this.STATE_KEY, configs);

    return updatedConfig;
  }

  /**
   * Delete a prompt configuration
   */
  public static async delete(id: string): Promise<boolean> {
    if (id.startsWith("preset_")) {
      return false; // Cannot delete presets
    }

    const configs =
      this.context.workspaceState.get<PromptConfig[]>(this.STATE_KEY) || [];
    const filtered = configs.filter((c) => c.id !== id);

    if (filtered.length === configs.length) {
      return false; // Not found
    }

    await this.context.workspaceState.update(this.STATE_KEY, filtered);
    return true;
  }

  /**
   * Export a prompt configuration as JSON
   */
  public static export(config: PromptConfig): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import a prompt configuration from JSON
   */
  public static async import(jsonString: string): Promise<PromptConfig> {
    const data = JSON.parse(jsonString) as PromptConfigInput;
    return this.create(data);
  }

  /**
   * Export all configurations as JSON
   */
  public static exportAll(): string {
    const configs =
      this.context.workspaceState.get<PromptConfig[]>(this.STATE_KEY) || [];
    return JSON.stringify(configs, null, 2);
  }

  /**
   * Import multiple configurations from JSON
   */
  public static async importAll(jsonString: string): Promise<PromptConfig[]> {
    const data = JSON.parse(jsonString) as PromptConfigInput[];
    const imported: PromptConfig[] = [];

    for (const item of data) {
      const config = await this.create(item);
      imported.push(config);
    }

    return imported;
  }
}
