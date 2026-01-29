import {
  CancellationTokenSource,
  LanguageModelChatMessage,
  LanguageModelChatResponse,
  lm,
  LanguageModelChat,
} from "vscode";

export class CopilotService {
  private static readonly COPILOT_FAMILY = "gpt-4o-mini";

  /**
   * Sends a prompt to Copilot and returns the response as a stream of text chunks.
   * @param prompt - The message to send to Copilot
   * @param onChunk - Callback function that receives text chunks as they arrive
   * @returns A promise that resolves when streaming is complete
   */
  public static async promptCopilotStream(
    prompt: string,
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    if (!prompt) {
      return "";
    }

    try {
      const messages = [LanguageModelChatMessage.User(prompt)];
      const chatResponse = await this.getChatResponse(messages);

      if (!chatResponse) {
        return "";
      }

      let fullResponse = "";
      for await (const fragment of chatResponse.text) {
        onChunk(fragment);
        fullResponse += fragment;
      }

      return fullResponse;
    } catch (err) {
      console.error(
        `CopilotService:promptCopilotStream:: ${(err as Error).message}`,
      );
      return "";
    }
  }

  /**
   * Sends a prompt to Copilot and returns the complete response.
   * @param prompt - The message to send to Copilot
   * @returns A promise that resolves to the full response text
   */
  public static async promptCopilot(
    prompt: string,
  ): Promise<string | undefined> {
    if (!prompt) {
      return;
    }

    try {
      const messages = [LanguageModelChatMessage.User(prompt)];
      const chatResponse = await this.getChatResponse(messages);

      if (!chatResponse) {
        return;
      }

      return await this.getFullResponse(chatResponse);
    } catch (err) {
      console.error(`CopilotService:promptCopilot:: ${(err as Error).message}`);
      return "";
    }
  }

  /**
   * Sends a chat request with conversation history.
   * @param messages - Array of LanguageModelChatMessage objects representing the conversation
   * @returns A promise that resolves to the response text
   */
  public static async sendChatRequest(
    messages: LanguageModelChatMessage[],
  ): Promise<string | undefined> {
    try {
      const chatResponse = await this.getChatResponse(messages);

      if (!chatResponse) {
        return;
      }

      return await this.getFullResponse(chatResponse);
    } catch (err) {
      console.error(
        `CopilotService:sendChatRequest:: ${(err as Error).message}`,
      );
      return "";
    }
  }

  /**
   * Sends a chat request with conversation history and streams the response.
   * @param messages - Array of LanguageModelChatMessage objects representing the conversation
   * @param onChunk - Callback function that receives text chunks as they arrive
   * @returns A promise that resolves to the full response text
   */
  public static async sendChatRequestStream(
    messages: LanguageModelChatMessage[],
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    try {
      const chatResponse = await this.getChatResponse(messages);

      if (!chatResponse) {
        return "";
      }

      let fullResponse = "";
      for await (const fragment of chatResponse.text) {
        onChunk(fragment);
        fullResponse += fragment;
      }

      return fullResponse;
    } catch (err) {
      console.error(
        `CopilotService:sendChatRequestStream:: ${(err as Error).message}`,
      );
      return "";
    }
  }

  /**
   * Retrieves all available language models.
   * @returns A promise that resolves to an array of available language models
   */
  public static async getAllModels(): Promise<LanguageModelChat[]> {
    try {
      const models = await lm.selectChatModels({
        vendor: "copilot",
      });
      const uniqueModels = new Map<string, LanguageModelChat>();
      for (const model of models) {
        if (!uniqueModels.has(model.id)) {
          uniqueModels.set(model.id, model);
        }
      }
      return Array.from(uniqueModels.values());
    } catch (err) {
      console.error(`CopilotService:getAllModels:: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Retrieves the chat response from the language model.
   * @param messages - The chat messages to send to the language model.
   * @returns The chat response
   */
  private static async getChatResponse(
    messages: LanguageModelChatMessage[],
  ): Promise<LanguageModelChatResponse | undefined> {
    try {
      const model = await this.getModel();
      if (!model) {
        return;
      }

      const chatResponse = await model.sendRequest(
        messages,
        {},
        new CancellationTokenSource().token,
      );

      return chatResponse;
    } catch (err) {
      console.error(
        `CopilotService:getChatResponse:: ${(err as Error).message}`,
      );
      return;
    }
  }

  /**
   * Converts a streaming chat response to a full string.
   * @param chatResponse - The chat response to convert
   * @returns The full response text
   */
  private static async getFullResponse(
    chatResponse: LanguageModelChatResponse,
  ): Promise<string> {
    const allFragments = [];
    for await (const fragment of chatResponse.text) {
      allFragments.push(fragment);
    }
    return allFragments.join("");
  }

  /**
   * Retrieves the chat model for the Copilot service.
   * @returns A Promise that resolves to the chat model.
   */
  private static async getModel(
    retry = 0,
  ): Promise<LanguageModelChat | undefined> {
    try {
      const [model] = await lm.selectChatModels({
        vendor: "copilot",
        family: this.COPILOT_FAMILY,
      });

      if ((!model || !model.sendRequest) && retry <= 5) {
        await this.sleep(1000);
        return this.getModel(retry + 1);
      }

      return model;
    } catch (err) {
      console.error(`CopilotService:getModel:: ${(err as Error).message}`);
      return;
    }
  }

  /**
   * Utility function to sleep for a given number of milliseconds.
   * @param ms - The number of milliseconds to sleep
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
