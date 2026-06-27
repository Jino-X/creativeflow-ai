import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiService } from './ai.service';
import { GenerateContentDto } from './dto/generate-content.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(RolesGuard)
// AI calls can be expensive; apply a tighter rate limit than the global default.
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  status() {
    return this.aiService.status;
  }

  @Post('requests/:id/enrich')
  enrich(
    @CurrentUser('organizationId') orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aiService.enrichRequest(orgId, id);
  }

  @Roles(Role.ORG_ADMIN, Role.CREATIVE_MANAGER, Role.DESIGNER, Role.REQUESTER, Role.SUPER_ADMIN)
  @Post('generate')
  generate(@Body() dto: GenerateContentDto) {
    return this.aiService.generateContent(dto);
  }

  @Post('assets/:id/tag')
  tagAsset(
    @CurrentUser('organizationId') orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aiService.tagAsset(orgId, id);
  }
}
