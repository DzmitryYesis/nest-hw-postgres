import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SessionModelType,
  Session,
  SessionDocument,
} from '../domain/session.entity';
import { SessionStatusEnum } from '../../../constants';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
  ) {}

  async findSessionByDeviceIdAndIat(
    deviceId: string,
    iat: number,
  ): Promise<SessionDocument | null> {
    return this.SessionModel.findOne({
      deviceId,
      iat,
      sessionStatus: { $ne: SessionStatusEnum.DELETED },
    });
  }

  async findSessionByDeviceId(
    deviceId: string,
  ): Promise<SessionDocument | null> {
    return this.SessionModel.findOne({
      deviceId,
      sessionStatus: { $ne: SessionStatusEnum.DELETED },
    });
  }

  async save(session: SessionDocument) {
    await session.save();
  }

  async deleteSessionsExcludeCurrent(
    deviceId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.SessionModel.deleteMany({
      userId,
      deviceId: { $ne: deviceId },
    });

    return result.deletedCount > 0;
  }
}
