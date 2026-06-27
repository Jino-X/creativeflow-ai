// Mirrors the Prisma enums and API response shapes from apps/api.

export type Role =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'CREATIVE_MANAGER'
  | 'DESIGNER'
  | 'REQUESTER';

export type RequestType =
  | 'BANNER'
  | 'SOCIAL_MEDIA'
  | 'VIDEO'
  | 'LANDING_PAGE'
  | 'PRESENTATION'
  | 'EMAIL_CAMPAIGN'
  | 'OTHER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type AssetStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface OrgUser extends AuthUser {
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string | null;
  isArchived: boolean;
  createdAt: string;
  _count?: { requests: number };
}

export interface CreativeRequest {
  id: string;
  title: string;
  description: string | null;
  type: RequestType;
  priority: Priority;
  status: RequestStatus;
  campaign: string | null;
  department: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  project?: { id: string; name: string } | null;
  requester?: UserSummary;
  assignee?: UserSummary | null;
  aiSummary?: string | null;
  aiAcceptanceCriteria?: string[] | null;
  aiSuggestedType?: RequestType | null;
  aiSuggestedPriority?: Priority | null;
  aiConfidence?: number | null;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  note: string | null;
  createdAt: string;
  changedBy?: UserSummary | null;
}

export interface RequestDetail extends CreativeRequest {
  statusHistory: StatusHistoryEntry[];
  availableTransitions: RequestStatus[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssetVersion {
  id: string;
  version: number;
  fileName: string;
  mimeType: string;
  size: number;
  notes: string | null;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  status: AssetStatus;
  currentVersion: number;
  reviewNote: string | null;
  aiTags: string[] | null;
  createdAt: string;
  uploadedBy?: UserSummary;
  reviewedBy?: UserSummary | null;
  versions: AssetVersion[];
}

export interface CommentMention {
  id: string;
  user: UserSummary;
}

export interface Comment {
  id: string;
  body: string;
  isEdited: boolean;
  createdAt: string;
  parentId: string | null;
  author: UserSummary;
  mentions: CommentMention[];
  replies?: Comment[];
}

export interface AiClassification {
  type: RequestType;
  priority: Priority;
  confidence: number;
  source: 'gemini' | 'heuristic';
}

export interface AiEnrichment {
  summary: string;
  acceptanceCriteria: string[];
  classification: AiClassification;
}

export interface RequestFilters {
  status?: RequestStatus;
  priority?: Priority;
  type?: RequestType;
  projectId?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type PaginatedResponse<T> = Paginated<T>;
