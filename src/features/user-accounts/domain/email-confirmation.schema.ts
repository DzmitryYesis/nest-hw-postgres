import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  _id: false,
})
export class EmailConfirmation {
  @Prop({ required: true, type: String })
  confirmationCode: string;

  @Prop({ required: true, type: Date })
  expirationDate: Date;

  @Prop({ required: true, type: Boolean })
  isConfirmed: boolean;
}

export const EmailConfirmationSchema =
  SchemaFactory.createForClass(EmailConfirmation);
