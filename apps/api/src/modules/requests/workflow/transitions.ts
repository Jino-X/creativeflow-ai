import { RequestStatus } from '@prisma/client';

/**
 * Status lifecycle (from spec):
 *   Draft → Submitted → Assigned → In Progress → Review
 *     → Changes Requested → (back to In Progress)
 *     → Approved → Completed
 *   Most active states may also be Cancelled.
 */
export const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.DRAFT]: [RequestStatus.SUBMITTED, RequestStatus.CANCELLED],
  [RequestStatus.SUBMITTED]: [RequestStatus.ASSIGNED, RequestStatus.CANCELLED],
  [RequestStatus.ASSIGNED]: [RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED],
  [RequestStatus.IN_PROGRESS]: [RequestStatus.REVIEW, RequestStatus.CANCELLED],
  [RequestStatus.REVIEW]: [
    RequestStatus.CHANGES_REQUESTED,
    RequestStatus.APPROVED,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.CHANGES_REQUESTED]: [RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED],
  [RequestStatus.APPROVED]: [RequestStatus.COMPLETED, RequestStatus.CANCELLED],
  [RequestStatus.COMPLETED]: [],
  [RequestStatus.CANCELLED]: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: RequestStatus): RequestStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}
