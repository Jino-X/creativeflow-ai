import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin wrapper around the Gemini SDK. When no API key is configured the client
 * reports itself disabled so callers can fall back to deterministic heuristics.
 */
@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly client?: GoogleGenerativeAI;
  private readonly model: string;
  readonly enabled: boolean;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('gemini.apiKey') ?? '';
    this.model = config.get<string>('gemini.model') ?? 'gemini-1.5-flash';
    this.enabled = Boolean(apiKey);
    if (this.enabled) {
      this.client = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY not set — AI features will use heuristic fallbacks.');
    }
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini client is not configured');
    }
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction,
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Ask Gemini for strict JSON and parse it. Strips common markdown fences.
   */
  async generateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
    const raw = await this.generateText(
      `${prompt}\n\nRespond with ONLY valid minified JSON, no markdown, no commentary.`,
      systemInstruction,
    );
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new Error(`Gemini returned non-JSON output: ${raw.slice(0, 200)}`);
    }
  }
}
