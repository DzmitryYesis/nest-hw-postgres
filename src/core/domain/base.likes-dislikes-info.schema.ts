import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  BaseLikesDislikesDBData,
  BaseLikesDislikesDbDataSchema,
} from './base.likes-dislikes-db-data.schema';

@Schema({
  _id: false,
})
export class BaseLikesDislikesInfo {
  @Prop({ type: [BaseLikesDislikesDbDataSchema], default: [] })
  likes: BaseLikesDislikesDBData[];

  @Prop({ type: [BaseLikesDislikesDbDataSchema], default: [] })
  dislikes: BaseLikesDislikesDBData[];
}

export const BaseExtendedLikesInfoSchema = SchemaFactory.createForClass(
  BaseLikesDislikesInfo,
);
