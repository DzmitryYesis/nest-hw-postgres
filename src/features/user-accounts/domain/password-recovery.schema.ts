import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  _id: false,
})
export class PasswordRecovery {
  @Prop({ type: String, default: null })
  recoveryCode: string | null;

  @Prop({ type: Date, default: null })
  expirationDate: Date | null;

  @Prop({ type: Date, default: null })
  lastUpdateDate: Date | null;
}

export const PasswordRecoverySchema =
  SchemaFactory.createForClass(PasswordRecovery);
