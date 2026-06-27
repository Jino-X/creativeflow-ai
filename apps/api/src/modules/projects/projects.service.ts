import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { requests: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  create(organizationId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        ownerId: dto.ownerId,
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateProjectDto) {
    await this.findOne(organizationId, id);
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }
}
