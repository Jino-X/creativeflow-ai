import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AssetsService, UploadedFile as MulterFile } from './assets.service';
import { AddVersionDto } from './dto/add-version.dto';
import { ReviewAssetDto } from './dto/review-asset.dto';
import { UploadAssetDto } from './dto/upload-asset.dto';

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller()
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('requests/:requestId/assets')
  list(
    @CurrentUser('organizationId') orgId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.assetsService.listForRequest(orgId, requestId);
  }

  @Post('requests/:requestId/assets')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @UploadedFile() file: MulterFile,
    @Body() dto: UploadAssetDto,
  ) {
    return this.assetsService.upload(user, requestId, file, dto.name, dto.notes);
  }

  @Get('assets/:id')
  findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assetsService.findOne(orgId, id);
  }

  @Post('assets/:id/versions')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  addVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: MulterFile,
    @Body() dto: AddVersionDto,
  ) {
    return this.assetsService.addVersion(user, id, file, dto.notes);
  }

  @Roles(Role.ORG_ADMIN, Role.CREATIVE_MANAGER, Role.SUPER_ADMIN)
  @Post('assets/:id/review')
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewAssetDto,
  ) {
    return this.assetsService.review(user, id, dto);
  }

  @Get('assets/:id/download')
  async download(
    @CurrentUser('organizationId') orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
    @Query('version') version?: string,
  ) {
    const parsedVersion = version ? Number.parseInt(version, 10) : undefined;
    const { buffer, version: v } = await this.assetsService.getDownload(
      orgId,
      id,
      parsedVersion,
    );
    res.set({
      'Content-Type': v.mimeType,
      'Content-Disposition': `attachment; filename="${v.fileName}"`,
      'Content-Length': String(v.size),
    });
    res.end(buffer);
  }

  @Roles(Role.ORG_ADMIN, Role.CREATIVE_MANAGER, Role.SUPER_ADMIN)
  @Delete('assets/:id')
  remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assetsService.remove(orgId, id);
  }
}
