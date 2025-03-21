import { Session, SessionModelType } from '../../domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { SessionDeviceViewDto } from '../../dto/view-dto/session-device.view-dto';
import { SessionStatusEnum } from '../../../../constants';

export class SessionsQueryRepository {
  constructor(
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
  ) {}

  async getAllDevices(userId: string): Promise<SessionDeviceViewDto[]> {
    const devices = await this.SessionModel.find({
      userId,
      sessionStatus: { $ne: SessionStatusEnum.DELETED },
    });

    return devices.map(SessionDeviceViewDto.mapToView);
  }
}
