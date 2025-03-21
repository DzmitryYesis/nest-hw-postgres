import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentQueryRepository } from '../infrastructure';
import { CommentInputDto, CommentViewDto } from '../dto';
import { Types } from 'mongoose';
import { BearerAuthGuard } from '../../../../core';
import { Public } from '../../../../core/decorators';
import { COMMENTS_API_PATH } from '../../../../constants';
import { BaseLikeStatusInputDto } from '../../../../core/dto';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateCommentCommand } from '../application/use-cases/update-comment.use-case';
import { ChangeCommentLikeStatusCommand } from '../application/use-cases/change-comment-like-status.use-case';
import { DeleteCommentCommand } from '../application/use-cases/delete-comment.use-case';

@UseGuards(BearerAuthGuard)
@Controller(COMMENTS_API_PATH.ROOT_URL)
export class CommentController {
  constructor(
    private commentQueryRepository: CommentQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Public()
  @Get(':id')
  async getCommentById(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
  ): Promise<CommentViewDto> {
    return this.commentQueryRepository.getCommentById(id, req.userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
    @Body() data: CommentInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(
      new UpdateCommentCommand(id, data, req.userId),
    );
  }

  @Put(`:id/${COMMENTS_API_PATH.LIKE_STATUS}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeLikeStatus(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
    @Body() data: BaseLikeStatusInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(
      new ChangeCommentLikeStatusCommand(req.userId, id, data),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
  ): Promise<void> {
    return await this.commandBus.execute(
      new DeleteCommentCommand(id, req.userId),
    );
  }
}
