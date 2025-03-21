import { SessionDocument } from '../../domain/session.entity';

export class SessionDeviceViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  static mapToView(sessionDevice: SessionDocument): SessionDeviceViewDto {
    const dto = new SessionDeviceViewDto();

    dto.ip = sessionDevice.ip;
    dto.title = sessionDevice.deviceName;
    dto.deviceId = sessionDevice.deviceId;
    dto.lastActiveDate = new Date(sessionDevice.iat * 1000).toISOString();

    return dto;
  }
}
