import Anthropic from '@anthropic-ai/sdk';
import { appConfig } from '../../config/app.config';
import { claudeConfig, fillTemplate } from '../../config/claude.config';
import { logger } from '../../utils/logger';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; source?: any }>;
}

export interface ClaudeResponse {
  content: string;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class ClaudeClientService {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor() {
    if (!appConfig.claude.apiKey) {
      throw new Error('CLAUDE_API_KEY is required but not configured');
    }

    this.client = new Anthropic({
      apiKey: appConfig.claude.apiKey,
    });

    this.model = claudeConfig.model;
    this.maxTokens = claudeConfig.maxTokens;
    this.temperature = claudeConfig.temperature;

    logger.info('ClaudeClient initialized', {
      model: this.model,
      maxTokens: this.maxTokens,
    });
  }

  /**
   * Send a message to Claude with optional vision input
   */
  async sendMessage(
    messages: ClaudeMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<ClaudeResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || this.maxTokens,
        temperature: options?.temperature || this.temperature,
        messages: messages as any,
        ...(options?.systemPrompt && { system: options.systemPrompt }),
      });

      logger.info('Claude API call successful', {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        stopReason: response.stop_reason,
      });

      // Extract text content from response
      const textContent = response.content
        .filter((block) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n');

      return {
        content: textContent,
        stopReason: response.stop_reason || 'unknown',
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error: any) {
      logger.error('Claude API call failed', {
        error: error.message,
        status: error.status,
      });
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Analyze failure with text and optional image
   */
  async analyzeFailure(params: {
    testName: string;
    platform: string;
    errorMessage: string;
    stackTrace: string;
    locatorUsed?: string;
    screenshot?: string; // base64 encoded
  }): Promise<ClaudeResponse> {
    // Fill prompt template
    const promptText = fillTemplate(claudeConfig.prompts.failureAnalysis, {
      testName: params.testName,
      platform: params.platform,
      errorMessage: params.errorMessage,
      stackTrace: params.stackTrace,
      locatorUsed: params.locatorUsed || '',
    });

    // Build message content with optional image
    const content: any[] = [{ type: 'text', text: promptText }];

    if (params.screenshot) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: params.screenshot,
        },
      });
    }

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content,
      },
    ];

    return await this.sendMessage(messages);
  }

  /**
   * Suggest better locator based on screenshot and context
   */
  async suggestLocator(params: {
    locatorType: string;
    locatorValue: string;
    error: string;
    pageContext: string;
    screenshot: string; // base64 encoded
  }): Promise<ClaudeResponse> {
    const promptText = fillTemplate(claudeConfig.prompts.locatorSuggestion, {
      locatorType: params.locatorType,
      locatorValue: params.locatorValue,
      error: params.error,
      pageContext: params.pageContext,
    });

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: params.screenshot,
            },
          },
        ],
      },
    ];

    return await this.sendMessage(messages);
  }

  /**
   * Analyze UI elements in screenshot
   */
  async analyzeElements(params: {
    focusArea: string;
    screenshot: string; // base64 encoded
  }): Promise<ClaudeResponse> {
    const promptText = fillTemplate(claudeConfig.prompts.elementAnalysis, {
      focusArea: params.focusArea,
    });

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: params.screenshot,
            },
          },
        ],
      },
    ];

    return await this.sendMessage(messages);
  }

  /**
   * Parse JSON response from Claude
   */
  parseJsonResponse<T>(response: ClaudeResponse): T {
    try {
      // Extract JSON from code blocks if present
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                       response.content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, response.content];

      const jsonString = jsonMatch[1] || response.content;
      return JSON.parse(jsonString.trim());
    } catch (error: any) {
      logger.error('Failed to parse Claude JSON response', {
        error: error.message,
        response: response.content.substring(0, 500),
      });
      throw new Error(`Failed to parse JSON from Claude response: ${error.message}`);
    }
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
    };
  }
}

// Export singleton instance
export const claudeClient = new ClaudeClientService();
