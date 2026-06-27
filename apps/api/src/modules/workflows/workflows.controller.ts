import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowsService } from './workflows.service';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get('state-machine')
  getStateMachine() {
    return this.workflowsService.getStateMachine();
  }

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string) {
    return this.workflowsService.findAll(orgId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.findOne(orgId, id);
  }

  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@CurrentUser('organizationId') orgId: string, @Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(orgId, dto);
  }

  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.remove(orgId, id);
  }
}
