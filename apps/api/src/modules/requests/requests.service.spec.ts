import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequestsService } from './requests.service';

describe('RequestsService.transition', () => {
  let service: RequestsService;
  let prisma: {
    creativeRequest: { findFirst: jest.Mock; update: jest.Mock };
    user: { findFirst: jest.Mock };
  };

  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'manager@acme.test',
    organizationId: 'org-1',
    role: Role.CREATIVE_MANAGER,
  };

  beforeEach(() => {
    prisma = {
      creativeRequest: { findFirst: jest.fn(), update: jest.fn() },
      user: { findFirst: jest.fn() },
    };
    service = new RequestsService(prisma as unknown as PrismaService);
  });

  it('throws NotFound when the request is missing or in another tenant', async () => {
    prisma.creativeRequest.findFirst.mockResolvedValue(null);
    await expect(
      service.transition(user, 'missing', { toStatus: RequestStatus.SUBMITTED }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an illegal status transition', async () => {
    prisma.creativeRequest.findFirst.mockResolvedValue({
      id: 'r1',
      organizationId: 'org-1',
      status: RequestStatus.DRAFT,
      assigneeId: null,
    });
    await expect(
      service.transition(user, 'r1', { toStatus: RequestStatus.COMPLETED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires an assignee when moving to ASSIGNED', async () => {
    prisma.creativeRequest.findFirst.mockResolvedValue({
      id: 'r1',
      organizationId: 'org-1',
      status: RequestStatus.SUBMITTED,
      assigneeId: null,
    });
    await expect(
      service.transition(user, 'r1', { toStatus: RequestStatus.ASSIGNED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('performs a valid transition and records history', async () => {
    prisma.creativeRequest.findFirst.mockResolvedValue({
      id: 'r1',
      organizationId: 'org-1',
      status: RequestStatus.IN_PROGRESS,
      assigneeId: 'designer-1',
    });
    prisma.creativeRequest.update.mockResolvedValue({ id: 'r1', status: RequestStatus.REVIEW });

    const result = await service.transition(user, 'r1', { toStatus: RequestStatus.REVIEW });

    expect(result.status).toBe(RequestStatus.REVIEW);
    const updateArg = prisma.creativeRequest.update.mock.calls[0][0];
    expect(updateArg.data.status).toBe(RequestStatus.REVIEW);
    expect(updateArg.data.statusHistory.create).toMatchObject({
      fromStatus: RequestStatus.IN_PROGRESS,
      toStatus: RequestStatus.REVIEW,
      changedById: 'user-1',
    });
  });

  it('sets completedAt when transitioning to COMPLETED', async () => {
    prisma.creativeRequest.findFirst.mockResolvedValue({
      id: 'r1',
      organizationId: 'org-1',
      status: RequestStatus.APPROVED,
      assigneeId: 'designer-1',
    });
    prisma.creativeRequest.update.mockResolvedValue({ id: 'r1' });

    await service.transition(user, 'r1', { toStatus: RequestStatus.COMPLETED });

    const updateArg = prisma.creativeRequest.update.mock.calls[0][0];
    expect(updateArg.data.completedAt).toBeInstanceOf(Date);
  });
});
