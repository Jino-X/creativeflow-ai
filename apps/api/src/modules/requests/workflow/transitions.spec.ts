import { RequestStatus } from '@prisma/client';
import { ALLOWED_TRANSITIONS, canTransition, nextStatuses } from './transitions';

describe('workflow transitions', () => {
  it('allows the happy path through the lifecycle', () => {
    expect(canTransition(RequestStatus.DRAFT, RequestStatus.SUBMITTED)).toBe(true);
    expect(canTransition(RequestStatus.SUBMITTED, RequestStatus.ASSIGNED)).toBe(true);
    expect(canTransition(RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS)).toBe(true);
    expect(canTransition(RequestStatus.IN_PROGRESS, RequestStatus.REVIEW)).toBe(true);
    expect(canTransition(RequestStatus.REVIEW, RequestStatus.APPROVED)).toBe(true);
    expect(canTransition(RequestStatus.APPROVED, RequestStatus.COMPLETED)).toBe(true);
  });

  it('supports the changes-requested rework loop', () => {
    expect(canTransition(RequestStatus.REVIEW, RequestStatus.CHANGES_REQUESTED)).toBe(true);
    expect(canTransition(RequestStatus.CHANGES_REQUESTED, RequestStatus.IN_PROGRESS)).toBe(true);
  });

  it('rejects illegal jumps', () => {
    expect(canTransition(RequestStatus.DRAFT, RequestStatus.COMPLETED)).toBe(false);
    expect(canTransition(RequestStatus.DRAFT, RequestStatus.APPROVED)).toBe(false);
    expect(canTransition(RequestStatus.SUBMITTED, RequestStatus.IN_PROGRESS)).toBe(false);
  });

  it('treats COMPLETED and CANCELLED as terminal states', () => {
    expect(nextStatuses(RequestStatus.COMPLETED)).toHaveLength(0);
    expect(nextStatuses(RequestStatus.CANCELLED)).toHaveLength(0);
  });

  it('allows cancellation from every active state', () => {
    const active = [
      RequestStatus.DRAFT,
      RequestStatus.SUBMITTED,
      RequestStatus.ASSIGNED,
      RequestStatus.IN_PROGRESS,
      RequestStatus.REVIEW,
      RequestStatus.CHANGES_REQUESTED,
      RequestStatus.APPROVED,
    ];
    for (const status of active) {
      expect(canTransition(status, RequestStatus.CANCELLED)).toBe(true);
    }
  });

  it('defines transitions for every status', () => {
    expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual(
      Object.values(RequestStatus).sort(),
    );
  });
});
