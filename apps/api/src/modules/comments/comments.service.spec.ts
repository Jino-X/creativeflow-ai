import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: any;

  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'a@acme.test',
    organizationId: 'org-1',
    role: Role.REQUESTER,
  };

  beforeEach(() => {
    prisma = {
      creativeRequest: { findFirst: jest.fn().mockResolvedValue({ id: 'req-1' }) },
      comment: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      user: { findMany: jest.fn() },
    };
    service = new CommentsService(prisma as PrismaService);
  });

  it('rejects a comment on a request from another tenant', async () => {
    prisma.creativeRequest.findFirst.mockResolvedValue(null);
    await expect(
      service.create(user, 'req-x', { body: 'hi' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects mentions of users outside the organization', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u2' }]); // only 1 of 2 found
    await expect(
      service.create(user, 'req-1', { body: 'hey', mentionedUserIds: ['u2', 'u3'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents nesting replies more than one level deep', async () => {
    prisma.comment.findFirst.mockResolvedValue({ id: 'p1', parentId: 'grandparent' });
    await expect(
      service.create(user, 'req-1', { body: 'reply', parentId: 'p1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a comment with validated mentions', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u2' }, { id: 'u3' }]);
    prisma.comment.create.mockResolvedValue({ id: 'c1', body: 'hello' });

    await service.create(user, 'req-1', {
      body: 'hello @u2 @u3',
      mentionedUserIds: ['u2', 'u3'],
    });

    const arg = prisma.comment.create.mock.calls[0][0];
    expect(arg.data.mentions.create).toEqual([{ userId: 'u2' }, { userId: 'u3' }]);
    expect(arg.data.authorId).toBe('user-1');
  });

  it('forbids editing another user comment', async () => {
    prisma.comment.findFirst.mockResolvedValue({ id: 'c1', authorId: 'someone-else' });
    await expect(
      service.update(user, 'c1', { body: 'edit' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a manager to delete any comment', async () => {
    const manager = { ...user, role: Role.CREATIVE_MANAGER };
    prisma.comment.findFirst.mockResolvedValue({ id: 'c1', authorId: 'someone-else' });
    prisma.comment.delete.mockResolvedValue({});
    await expect(service.remove(manager, 'c1')).resolves.toEqual({ success: true });
  });
});
