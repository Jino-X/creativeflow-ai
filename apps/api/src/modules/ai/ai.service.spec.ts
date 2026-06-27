import { Priority, RequestType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';
import { GeminiClient } from './gemini.client';

describe('AiService (heuristic fallback)', () => {
  let service: AiService;
  let prisma: any;
  let gemini: GeminiClient;

  beforeEach(() => {
    prisma = {
      creativeRequest: { findFirst: jest.fn(), update: jest.fn() },
      asset: { findFirst: jest.fn(), update: jest.fn() },
    };
    // Disabled Gemini → forces heuristic path.
    gemini = { enabled: false } as unknown as GeminiClient;
    service = new AiService(prisma as PrismaService, gemini);
  });

  it('reports disabled status without an API key', () => {
    expect(service.status).toEqual({ provider: 'gemini', enabled: false });
  });

  it('classifies a social media request via heuristics', async () => {
    const result = await service.classify('New Instagram story for launch', 'urgent reel');
    expect(result.type).toBe(RequestType.SOCIAL_MEDIA);
    expect(result.priority).toBe(Priority.CRITICAL);
    expect(result.source).toBe('heuristic');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('defaults to OTHER/MEDIUM for ambiguous text', async () => {
    const result = await service.classify('Misc task', 'something');
    expect(result.type).toBe(RequestType.OTHER);
    expect(result.priority).toBe(Priority.MEDIUM);
  });

  it('enriches and persists AI metadata on a request', async () => {
    prisma.creativeRequest.findFirst.mockResolvedValue({
      id: 'r1',
      organizationId: 'org-1',
      title: 'Landing page redesign',
      description: 'high priority website hero',
    });
    prisma.creativeRequest.update.mockResolvedValue({});

    const result = await service.enrichRequest('org-1', 'r1');

    expect(result.classification.type).toBe(RequestType.LANDING_PAGE);
    expect(result.acceptanceCriteria.length).toBeGreaterThan(0);
    const updateArg = prisma.creativeRequest.update.mock.calls[0][0];
    expect(updateArg.data.aiSuggestedType).toBe(RequestType.LANDING_PAGE);
    expect(updateArg.data.aiEnrichedAt).toBeInstanceOf(Date);
  });

  it('tags an asset from its latest version metadata', async () => {
    prisma.asset.findFirst.mockResolvedValue({
      id: 'a1',
      name: 'hero',
      versions: [{ fileName: 'hero-banner-final.png', mimeType: 'image/png' }],
    });
    prisma.asset.update.mockResolvedValue({});

    const { tags } = await service.tagAsset('org-1', 'a1');
    expect(tags).toEqual(expect.arrayContaining(['image', 'banner', 'graphic']));
  });

  it('generates content deterministically when disabled', async () => {
    const { content, source } = await service.generateContent({
      prompt: 'Summer sale',
      kind: 'headline',
    });
    expect(source).toBe('heuristic');
    expect(content).toContain('Summer sale');
  });
});
