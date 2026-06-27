import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateRequestDto } from './dto/create-request.dto';
import { QueryRequestsDto } from './dto/query-requests.dto';
import { TransitionRequestDto } from './dto/transition-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { canTransition, nextStatuses } from './workflow/transitions';

const requestInclude = {
  project: { select: { id: true, name: true } },
  requester: { select: { id: true, firstName: true, lastName: true, email: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.CreativeRequestInclude;

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreateRequestDto) {
    if (dto.projectId) {
      await this.assertProjectInOrg(user.organizationId, dto.projectId);
    }
    return this.prisma.creativeRequest.create({
      data: {
        organizationId: user.organizationId,
        requesterId: user.id,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority,
        campaign: dto.campaign,
        department: dto.department,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        projectId: dto.projectId,
        status: RequestStatus.DRAFT,
        statusHistory: {
          create: { toStatus: RequestStatus.DRAFT, changedById: user.id },
        },
      },
      include: requestInclude,
    });
  }

  async findAll(organizationId: string, query: QueryRequestsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.CreativeRequestWhereInput = {
      organizationId,
      status: query.status,
      priority: query.priority,
      type: query.type,
      projectId: query.projectId,
      assigneeId: query.assigneeId,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.creativeRequest.findMany({
        where,
        include: requestInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.creativeRequest.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(organizationId: string, id: string) {
    const request = await this.prisma.creativeRequest.findFirst({
      where: { id, organizationId },
      include: {
        ...requestInclude,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    return { ...request, availableTransitions: nextStatuses(request.status) };
  }

  async update(organizationId: string, id: string, dto: UpdateRequestDto) {
    const request = await this.findOne(organizationId, id);
    if (
      request.status === RequestStatus.COMPLETED ||
      request.status === RequestStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot edit a completed or cancelled request');
    }
    if (dto.projectId) {
      await this.assertProjectInOrg(organizationId, dto.projectId);
    }
    return this.prisma.creativeRequest.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: requestInclude,
    });
  }

  async transition(user: AuthenticatedUser, id: string, dto: TransitionRequestDto) {
    const request = await this.prisma.creativeRequest.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (!canTransition(request.status, dto.toStatus)) {
      throw new BadRequestException(
        `Invalid transition from ${request.status} to ${dto.toStatus}. ` +
          `Allowed: ${nextStatuses(request.status).join(', ') || 'none'}`,
      );
    }

    if (dto.toStatus === RequestStatus.ASSIGNED && !dto.assigneeId && !request.assigneeId) {
      throw new BadRequestException('An assignee is required to move a request to ASSIGNED');
    }
    if (dto.assigneeId) {
      await this.assertUserInOrg(user.organizationId, dto.assigneeId);
    }

    const data: Prisma.CreativeRequestUpdateInput = {
      status: dto.toStatus,
      statusHistory: {
        create: {
          fromStatus: request.status,
          toStatus: dto.toStatus,
          changedById: user.id,
          note: dto.note,
        },
      },
    };
    if (dto.assigneeId) {
      data.assignee = { connect: { id: dto.assigneeId } };
    }
    if (dto.toStatus === RequestStatus.COMPLETED) {
      data.completedAt = new Date();
    }

    return this.prisma.creativeRequest.update({
      where: { id },
      data,
      include: requestInclude,
    });
  }

  private async assertProjectInOrg(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });
    if (!project) {
      throw new ForbiddenException('Project does not belong to your organization');
    }
  }

  private async assertUserInOrg(organizationId: string, userId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, isActive: true },
      select: { id: true },
    });
    if (!member) {
      throw new ForbiddenException('Assignee is not an active member of your organization');
    }
  }
}
