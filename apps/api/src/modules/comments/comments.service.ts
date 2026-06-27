import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const authorSelect = { select: { id: true, firstName: true, lastName: true, email: true } };

const commentInclude = {
  author: authorSelect,
  mentions: { include: { user: authorSelect } },
};

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertRequest(orgId: string, requestId: string) {
    const request = await this.prisma.creativeRequest.findFirst({
      where: { id: requestId, organizationId: orgId },
      select: { id: true },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
  }

  private async validateMentions(orgId: string, userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }
    const found = await this.prisma.user.findMany({
      where: { id: { in: userIds }, organizationId: orgId, isActive: true },
      select: { id: true },
    });
    if (found.length !== userIds.length) {
      throw new BadRequestException('One or more mentioned users are not in your organization');
    }
    return found.map((u) => u.id);
  }

  async create(user: AuthenticatedUser, requestId: string, dto: CreateCommentDto) {
    await this.assertRequest(user.organizationId, requestId);

    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, requestId, organizationId: user.organizationId },
        select: { id: true, parentId: true },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found on this request');
      }
      if (parent.parentId) {
        throw new BadRequestException('Replies can only be one level deep');
      }
    }

    const mentionIds = await this.validateMentions(
      user.organizationId,
      dto.mentionedUserIds ?? [],
    );

    return this.prisma.comment.create({
      data: {
        organizationId: user.organizationId,
        requestId,
        authorId: user.id,
        parentId: dto.parentId,
        body: dto.body,
        mentions: { create: mentionIds.map((userId) => ({ userId })) },
      },
      include: commentInclude,
    });
  }

  async listForRequest(orgId: string, requestId: string) {
    await this.assertRequest(orgId, requestId);
    return this.prisma.comment.findMany({
      where: { organizationId: orgId, requestId, parentId: null },
      include: {
        ...commentInclude,
        replies: { include: commentInclude, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async findOwned(orgId: string, id: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateCommentDto) {
    const comment = await this.findOwned(user.organizationId, id);
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    return this.prisma.comment.update({
      where: { id },
      data: { body: dto.body, isEdited: true },
      include: commentInclude,
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    const comment = await this.findOwned(user.organizationId, id);
    const isPrivileged =
      user.role === Role.ORG_ADMIN ||
      user.role === Role.SUPER_ADMIN ||
      user.role === Role.CREATIVE_MANAGER;
    if (comment.authorId !== user.id && !isPrivileged) {
      throw new ForbiddenException('You cannot delete this comment');
    }
    await this.prisma.comment.delete({ where: { id } });
    return { success: true };
  }

  /** Notifications surface: comments where the user was mentioned. */
  listMentionsForUser(user: AuthenticatedUser) {
    return this.prisma.comment.findMany({
      where: {
        organizationId: user.organizationId,
        mentions: { some: { userId: user.id } },
      },
      include: { ...commentInclude, request: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
