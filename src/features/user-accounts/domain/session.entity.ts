import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SessionStatusEnum } from '../../../constants';
import { HydratedDocument, Model } from 'mongoose';
import { CreateSessionDomainDto } from '../dto';
import { UpdateSessionDto } from '../dto/input-dto/update-session.dto';

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: Number })
  exp: number;

  @Prop({ required: true, type: Number })
  iat: number;

  @Prop({ required: true, type: String })
  deviceId: string;

  @Prop({ required: true, type: String })
  deviceName: string;

  @Prop({ required: true, type: String })
  ip: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ enum: SessionStatusEnum, default: SessionStatusEnum.ACTIVE })
  sessionStatus: SessionStatusEnum;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  static createInstance(dto: CreateSessionDomainDto): SessionDocument {
    const session = new this();

    session.userId = dto.userId;
    session.deviceId = dto.deviceId;
    session.ip = dto.ip;
    session.deviceName = dto.deviceName;
    session.iat = dto.iat;
    session.exp = dto.exp;

    return session as SessionDocument;
  }

  updateSession(dto: UpdateSessionDto) {
    this.iat = dto.iat;
    this.exp = dto.exp;
  }

  deleteSession() {
    this.sessionStatus = SessionStatusEnum.DELETED;
    this.deletedAt = new Date();
  }
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.loadClass(Session);

export type SessionDocument = HydratedDocument<Session>;

export type SessionModelType = Model<SessionDocument> & typeof Session;
