import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Priority, RequestType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiClient } from './gemini.client';
import * as heuristics from './ai.heuristics';
import { GenerateContentDto } from './dto/generate-content.dto';

export interface ClassificationResult extends heuristics.Classification {
  source: 'gemini' | 'heuristic';
}

export interface EnrichmentResult {
  summary: string;
  acceptanceCriteria: string[];
  classification: ClassificationResult;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiClient,
  ) {}

  get status() {
    return { provider: 'gemini', enabled: this.gemini.enabled };
  }

  private async getRequest(orgId: string, requestId: string) {
    const request = await this.prisma.creativeRequest.findFirst({
      where: { id: requestId, organizationId: orgId },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    return request;
  }

  private normalizeType(value: unknown): RequestType {
    const upper = String(value).toUpperCase();
    return (Object.values(RequestType) as string[]).includes(upper)
      ? (upper as RequestType)
      : RequestType.OTHER;
  }

  private normalizePriority(value: unknown): Priority {
    const upper = String(value).toUpperCase();
    return (Object.values(Priority) as string[]).includes(upper)
      ? (upper as Priority)
      : Priority.MEDIUM;
  }

  async classify(title: string, description?: string): Promise<ClassificationResult> {
    if (this.gemini.enabled) {
      try {
        const data = await this.gemini.generateJson<{
          type: string;
          priority: string;
          confidence: number;
        }>(
          `Classify this creative request.\nTitle: ${title}\nDescription: ${description ?? ''}\n` +
            `Return JSON: {"type": one of ${Object.values(RequestType).join('|')}, ` +
            `"priority": one of ${Object.values(Priority).join('|')}, "confidence": 0..1}`,
          'You are a creative operations triage assistant.',
        );
        return {
          type: this.normalizeType(data.type),
          priority: this.normalizePriority(data.priority),
          confidence: Math.max(0, Math.min(1, Number(data.confidence) || 0.8)),
          source: 'gemini',
        };
      } catch (err) {
        this.logger.warn(`Gemini classify failed, falling back: ${(err as Error).message}`);
      }
    }
    return { ...heuristics.classify(title, description), source: 'heuristic' };
  }

  async summarize(title: string, description?: string) {
    if (this.gemini.enabled) {
      try {
        const data = await this.gemini.generateJson<{
          summary: string;
          acceptanceCriteria: string[];
        }>(
          `Summarize this creative request and produce acceptance criteria.\n` +
            `Title: ${title}\nDescription: ${description ?? ''}\n` +
            `Return JSON: {"summary": string, "acceptanceCriteria": string[]}`,
          'You are a senior creative producer writing crisp, testable acceptance criteria.',
        );
        if (data?.summary && Array.isArray(data.acceptanceCriteria)) {
          return { summary: data.summary, acceptanceCriteria: data.acceptanceCriteria };
        }
      } catch (err) {
        this.logger.warn(`Gemini summarize failed, falling back: ${(err as Error).message}`);
      }
    }
    return heuristics.summarize(title, description);
  }

  /** Classify + summarize a request and persist the AI metadata. */
  async enrichRequest(orgId: string, requestId: string): Promise<EnrichmentResult> {
    const request = await this.getRequest(orgId, requestId);
    const [classification, summary] = await Promise.all([
      this.classify(request.title, request.description ?? undefined),
      this.summarize(request.title, request.description ?? undefined),
    ]);

    await this.prisma.creativeRequest.update({
      where: { id: request.id },
      data: {
        aiSummary: summary.summary,
        aiAcceptanceCriteria: summary.acceptanceCriteria,
        aiSuggestedType: classification.type,
        aiSuggestedPriority: classification.priority,
        aiConfidence: classification.confidence,
        aiEnrichedAt: new Date(),
      },
    });

    return {
      summary: summary.summary,
      acceptanceCriteria: summary.acceptanceCriteria,
      classification,
    };
  }

  async generateContent(dto: GenerateContentDto): Promise<{ content: string; source: string }> {
    const kind = dto.kind ?? 'body_copy';
    const tone = dto.tone ?? 'professional';
    if (this.gemini.enabled) {
      try {
        const content = await this.gemini.generateText(
          `Write ${kind.replace('_', ' ')} in a ${tone} tone for: ${dto.prompt}`,
          'You are an expert marketing copywriter. Be concise and on-brand.',
        );
        return { content: content.trim(), source: 'gemini' };
      } catch (err) {
        this.logger.warn(`Gemini generateContent failed, falling back: ${(err as Error).message}`);
      }
    }
    // Deterministic fallback so the endpoint is always functional.
    return {
      content: `[${kind} · ${tone}] ${dto.prompt}`,
      source: 'heuristic',
    };
  }

  async tagAsset(orgId: string, assetId: string): Promise<{ tags: string[]; source: string }> {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, organizationId: orgId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    const latest = asset.versions[0];
    const tags = heuristics.tagFromFile(latest?.fileName ?? asset.name, latest?.mimeType ?? '');

    await this.prisma.asset.update({
      where: { id: asset.id },
      data: { aiTags: tags },
    });
    return { tags, source: this.gemini.enabled ? 'gemini-assisted' : 'heuristic' };
  }
}
