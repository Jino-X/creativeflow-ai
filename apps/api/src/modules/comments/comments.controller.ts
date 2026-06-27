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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('requests/:requestId/comments')
  list(
    @CurrentUser('organizationId') orgId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.commentsService.listForRequest(orgId, requestId);
  }

  @Post('requests/:requestId/comments')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user, requestId, dto);
  }

  @Get('comments/mentions')
  mentions(@CurrentUser() user: AuthenticatedUser) {
    return this.commentsService.listMentionsForUser(user);
  }

  @Patch('comments/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(user, id, dto);
  }

  @Delete('comments/:id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commentsService.remove(user, id);
  }
}
