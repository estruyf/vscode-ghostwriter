import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { FileService } from "./FileService";

export interface AgentFile {
  name: string;
  path: string;
  content: string;
}

export class AgentService {
  /**
   * Get all interviewer agent files from .ghostwriter/interviewer
   */
  static async getInterviewerAgents(): Promise<AgentFile[]> {
    const ghostwriterPath = await FileService.getGhostwriterFolder();
    if (!ghostwriterPath) {
      return [];
    }

    const interviewerPath = path.join(ghostwriterPath, "interviewer");

    if (!fs.existsSync(interviewerPath)) {
      return [];
    }

    const files = fs.readdirSync(interviewerPath);
    const agents: AgentFile[] = [];

    for (const file of files) {
      if (file.endsWith(".md")) {
        const filePath = path.join(interviewerPath, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const name = this.extractAgentName(content);

        agents.push({
          name: name || file.replace(".md", ""),
          path: filePath,
          content,
        });
      }
    }

    return agents;
  }

  /**
   * Get all writer agent files from .ghostwriter/writer
   */
  static async getWriterAgents(): Promise<AgentFile[]> {
    const ghostwriterPath = await FileService.getGhostwriterFolder();
    if (!ghostwriterPath) {
      return [];
    }

    const writerPath = path.join(ghostwriterPath, "writer");

    if (!fs.existsSync(writerPath)) {
      return [];
    }

    const files = fs.readdirSync(writerPath);
    const agents: AgentFile[] = [];

    for (const file of files) {
      if (file.endsWith(".md")) {
        const filePath = path.join(writerPath, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const name = this.extractAgentName(content);

        agents.push({
          name: name || file.replace(".md", ""),
          path: filePath,
          content,
        });
      }
    }

    return agents;
  }

  /**
   * Extract agent name from frontmatter
   */
  private static extractAgentName(content: string): string | null {
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return null;
    }

    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/name:\s*(.+)/);
    return nameMatch ? nameMatch[1].trim() : null;
  }

  /**
   * Extract agent prompt content (everything after frontmatter)
   */
  static extractAgentPrompt(content: string): string {
    const frontmatterMatch = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
    if (!frontmatterMatch) {
      return content;
    }

    return content.substring(frontmatterMatch[0].length).trim();
  }

  /**
   * Create a new interviewer agent file
   */
  static async createInterviewerAgent(name: string): Promise<AgentFile> {
    const ghostwriterPath = await FileService.getGhostwriterFolder();
    if (!ghostwriterPath) {
      throw new Error("Ghostwriter folder not found");
    }

    const interviewerPath = path.join(ghostwriterPath, "interviewer");

    // Ensure directory exists
    if (!fs.existsSync(interviewerPath)) {
      fs.mkdirSync(interviewerPath, { recursive: true });
    }

    // Create filename from name
    const filename = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".md";
    const filePath = path.join(interviewerPath, filename);

    // Create content with frontmatter and template prompt
    const content = `---
name: ${name}
---

Add your interviewer prompt here. This will be used to customize how the interviewer agent behaves.`;

    fs.writeFileSync(filePath, content, "utf-8");

    return {
      name,
      path: filePath,
      content,
    };
  }

  /**
   * Create a new writer agent file
   */
  static async createWriterAgent(name: string): Promise<AgentFile> {
    const ghostwriterPath = await FileService.getGhostwriterFolder();
    if (!ghostwriterPath) {
      throw new Error("Ghostwriter folder not found");
    }

    const writerPath = path.join(ghostwriterPath, "writer");

    // Ensure directory exists
    if (!fs.existsSync(writerPath)) {
      fs.mkdirSync(writerPath, { recursive: true });
    }

    // Create filename from name
    const filename = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".md";
    const filePath = path.join(writerPath, filename);

    // Create content with frontmatter and template prompt
    const content = `---
name: ${name}
---

Add your writer prompt here. This will be used to customize how the writer agent generates articles.`;

    fs.writeFileSync(filePath, content, "utf-8");

    return {
      name,
      path: filePath,
      content,
    };
  }

  /**
   * Update an existing interviewer agent file
   */
  static async updateInterviewerAgent(
    agentPath: string,
    name: string,
    prompt: string,
  ): Promise<AgentFile> {
    if (!fs.existsSync(agentPath)) {
      throw new Error("Interviewer agent not found");
    }

    const content = `---\nname: ${name}\n---\n\n${prompt}`;
    fs.writeFileSync(agentPath, content, "utf-8");

    return {
      name,
      path: agentPath,
      content,
    };
  }

  /**
   * Update an existing writer agent file
   */
  static async updateWriterAgent(
    agentPath: string,
    name: string,
    prompt: string,
  ): Promise<AgentFile> {
    if (!fs.existsSync(agentPath)) {
      throw new Error("Writer agent not found");
    }

    const content = `---\nname: ${name}\n---\n\n${prompt}`;
    fs.writeFileSync(agentPath, content, "utf-8");

    return {
      name,
      path: agentPath,
      content,
    };
  }

  /**
   * Get interviewer agent by path
   */
  static async getInterviewerAgentByPath(
    agentPath: string,
  ): Promise<AgentFile | null> {
    if (!fs.existsSync(agentPath)) {
      return null;
    }

    const content = fs.readFileSync(agentPath, "utf-8");
    const name = this.extractAgentName(content);

    return {
      name: name || path.basename(agentPath, ".md"),
      path: agentPath,
      content,
    };
  }

  /**
   * Get writer agent by path
   */
  static async getWriterAgentByPath(
    agentPath: string,
  ): Promise<AgentFile | null> {
    if (!fs.existsSync(agentPath)) {
      return null;
    }

    const content = fs.readFileSync(agentPath, "utf-8");
    const name = this.extractAgentName(content);

    return {
      name: name || path.basename(agentPath, ".md"),
      path: agentPath,
      content,
    };
  }

  /**
   * Build interviewer prompt with wrapper sections
   */
  static buildInterviewerPrompt(customPrompt: string): string {
    const topSection = `Act as an expert interviewer. I would like to create content with your support.
Your mission is to interview me to gather material that will be helpful,
relatable, and have a clear narrative thread.

Your process is to have a natural, yet structured, conversation to gather
information. At the end of the interview, you will be asked to provide the full
transcript of the interview, which will be saved to a markdown file.

---

`;

    const bottomSection = `

---

**Ending the Interview:**

- **Important:** I can stop the interview at any time by simply saying "stop" or
  "done" or by indicating the interview is complete.
- When the interview is complete (either you determine sufficient material has
  been gathered OR I explicitly end it), you MUST automatically provide the full
  markdown transcript without waiting for me to ask. You start the transcript with a note that indicates that the interview was completed. Use the following format: INTERVIEW COMPLETED
- Format the transcript as follows:
  - Start with a markdown heading for the interview topic
  - Include metadata about content type and today's date ({{date}})
  - Then a separator
  - Then the full Q&A exchange with clear speaker labels
  - End with any relevant notes or resources mentioned
- After providing the transcript, inform me that it will be saved automatically.

Please start the interview by asking me the first question.`;

    return topSection + customPrompt + bottomSection;
  }

  /**
   * Build writer prompt with wrapper sections
   */
  static buildWriterPrompt(customPrompt: string): string {
    const topSection = `Act as an expert writer. I need you to expand the work-in-progress content
currently in your context into a comprehensive, helpful piece that aligns with
our editorial guidelines.

## Important: Output Format

- Do NOT mention saving files, file paths, or directories
- Do NOT reference any filesystem locations
- Simply return the markdown content itself
- The application will handle displaying and saving the content

---

`;

    const bottomSection = `

---

## Output Expectations

- Return ONLY the article content as markdown
- Do NOT include any meta-commentary about where it's being saved or how to access it`;

    return topSection + customPrompt + bottomSection;
  }
}
