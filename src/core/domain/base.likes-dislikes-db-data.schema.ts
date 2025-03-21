import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  _id: false,
})
export class BaseLikesDislikesDBData {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  login: string;

  @Prop({ type: Date, default: Date.now })
  addedAt: Date;
}

export const BaseLikesDislikesDbDataSchema = SchemaFactory.createForClass(
  BaseLikesDislikesDBData,
);
