import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  _id: false,
})
export class CommentatorInfo {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String })
  userLogin: string;
}

export const CommentatorInfoSchema =
  SchemaFactory.createForClass(CommentatorInfo);
