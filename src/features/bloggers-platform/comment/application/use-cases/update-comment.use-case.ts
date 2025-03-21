import { ObjectId } from 'mongodb';
import { CommentInputDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class UpdateCommentCommand {
  constructor(
    public id: ObjectId,
    public dto: CommentInputDto,
    public userId: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(private commentRepository: CommentRepository) {}

  async execute(command: UpdateCommentCommand): Promise<void> {
    const {
      id,
      userId,
      dto: { content },
    } = command;

    const comment = await this.commentRepository.findCommentById(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    if (comment.commentatorInfo.userId !== userId) {
      throw new ForbiddenException("You can't do it");
    }

    comment.updateComment({ content });

    await this.commentRepository.save(comment);
  }
}
