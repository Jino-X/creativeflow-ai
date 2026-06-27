import type { AssetStatus, Priority, RequestStatus, RequestType, Role } from '@/lib/types';

export const STATUS_LABELS: Record<RequestStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'In Review',
  CHANGES_REQUESTED: 'Changes Requested',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Tailwind classes for status badges.
export const STATUS_COLORS: Record<RequestStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  ASSIGNED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  REVIEW: 'bg-purple-100 text-purple-700',
  CHANGES_REQUESTED: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-sky-100 text-sky-700',
  HIGH: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-rose-100 text-rose-700',
};

export const TYPE_LABELS: Record<RequestType, string> = {
  BANNER: 'Banner',
  SOCIAL_MEDIA: 'Social Media',
  VIDEO: 'Video',
  LANDING_PAGE: 'Landing Page',
  PRESENTATION: 'Presentation',
  EMAIL_CAMPAIGN: 'Email Campaign',
  OTHER: 'Other',
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Org Admin',
  CREATIVE_MANAGER: 'Creative Manager',
  DESIGNER: 'Designer',
  REQUESTER: 'Requester',
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

export const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as RequestStatus[];
export const PRIORITY_OPTIONS = Object.keys(PRIORITY_LABELS) as Priority[];
export const TYPE_OPTIONS = Object.keys(TYPE_LABELS) as RequestType[];
export const ROLE_OPTIONS = Object.keys(ROLE_LABELS) as Role[];

export function fullName(user?: { firstName: string; lastName: string } | null): string {
  if (!user) return 'Unassigned';
  return `${user.firstName} ${user.lastName}`.trim();
}

export function initials(user?: { firstName: string; lastName: string } | null): string {
  if (!user) return '?';
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
