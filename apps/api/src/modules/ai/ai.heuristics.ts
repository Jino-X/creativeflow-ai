import { Priority, RequestType } from '@prisma/client';

export interface Classification {
  type: RequestType;
  priority: Priority;
  confidence: number;
}

const TYPE_KEYWORDS: Array<[RequestType, RegExp]> = [
  [RequestType.SOCIAL_MEDIA, /\b(instagram|facebook|twitter|x\.com|tiktok|linkedin|social|post|story|reel)\b/i],
  [RequestType.VIDEO, /\b(video|reel|animation|motion|youtube|trailer|clip)\b/i],
  [RequestType.LANDING_PAGE, /\b(landing|web ?page|website|microsite|hero section)\b/i],
  [RequestType.PRESENTATION, /\b(deck|slide|presentation|pitch|powerpoint|keynote)\b/i],
  [RequestType.EMAIL_CAMPAIGN, /\b(email|newsletter|mailer|drip|campaign blast)\b/i],
  [RequestType.BANNER, /\b(banner|display ad|billboard|cover|header image)\b/i],
];

const PRIORITY_KEYWORDS: Array<[Priority, RegExp]> = [
  [Priority.CRITICAL, /\b(urgent|asap|critical|immediately|emergency|today)\b/i],
  [Priority.HIGH, /\b(high priority|important|launch|deadline|tomorrow|soon)\b/i],
  [Priority.LOW, /\b(whenever|no rush|low priority|nice to have|backlog)\b/i],
];

export function classify(title: string, description?: string): Classification {
  const text = `${title} ${description ?? ''}`;

  let type: RequestType = RequestType.OTHER;
  for (const [candidate, re] of TYPE_KEYWORDS) {
    if (re.test(text)) {
      type = candidate;
      break;
    }
  }

  let priority: Priority = Priority.MEDIUM;
  for (const [candidate, re] of PRIORITY_KEYWORDS) {
    if (re.test(text)) {
      priority = candidate;
      break;
    }
  }

  // Confidence is heuristic: higher when we actually matched something.
  const matchedType = type !== RequestType.OTHER;
  const matchedPriority = priority !== Priority.MEDIUM;
  const confidence = 0.4 + (matchedType ? 0.3 : 0) + (matchedPriority ? 0.2 : 0);

  return { type, priority, confidence: Math.min(confidence, 0.95) };
}

export function summarize(
  title: string,
  description?: string,
): { summary: string; acceptanceCriteria: string[] } {
  const desc = (description ?? '').trim();
  const summary = desc
    ? `${title}: ${desc.slice(0, 180)}${desc.length > 180 ? '…' : ''}`
    : title;

  const criteria = [
    `Deliverable matches the brief: "${title}".`,
    'Brand guidelines (colors, logo, typography) are followed.',
    'Final files are provided in the required formats and dimensions.',
    'Stakeholder review is completed and approved.',
  ];
  return { summary, acceptanceCriteria: criteria };
}

export function tagFromFile(fileName: string, mimeType: string): string[] {
  const tags = new Set<string>();
  const [kind] = mimeType.split('/');
  if (kind) tags.add(kind);
  if (/logo/i.test(fileName)) tags.add('logo');
  if (/banner|hero/i.test(fileName)) tags.add('banner');
  if (/final|v\d+/i.test(fileName)) tags.add('versioned');
  if (mimeType.includes('pdf')) tags.add('document');
  if (mimeType.startsWith('image/')) tags.add('graphic');
  if (mimeType.startsWith('video/')) tags.add('motion');
  return [...tags];
}
