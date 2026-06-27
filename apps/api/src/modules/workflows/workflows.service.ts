import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ALLOWED_TRANSITIONS } from '../requests/workflow/transitions';
import { CreateWorkflowDto } from './dto/create-workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  getStateMachine() {
    return Object.entries(ALLOWED_TRANSITIONS).map(([status, next]) => ({
      status,
      transitionsTo: next,
    }));
  }

  findAll(organizationId: string) {
    return this.prisma.workflow.findMany({
      where: { organizationId },
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    return workflow;
  }

  async create(organizationId: string, dto: CreateWorkflowDto) {
    if (dto.isDefault) {
      await this.prisma.workflow.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.workflow.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
        steps: { create: dto.steps },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.workflow.delete({ where: { id } });
    return { success: true };
  }
}
