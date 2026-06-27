import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string) {
    return this.projectsService.findAll(orgId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projectsService.findOne(orgId, id);
  }

  @Roles(Role.ORG_ADMIN, Role.CREATIVE_MANAGER, Role.SUPER_ADMIN)
  @Post()
  create(@CurrentUser('organizationId') orgId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(orgId, dto);
  }

  @Roles(Role.ORG_ADMIN, Role.CREATIVE_MANAGER, Role.SUPER_ADMIN)
  @Patch(':id')
  update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(orgId, id, dto);
  }

  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projectsService.remove(orgId, id);
  }
}
