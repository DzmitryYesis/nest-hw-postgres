import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SECURITY_API_PATH } from '../../../constants';
import { RefreshAuthGuard } from '../../../core/guards/refresh-guard/refresh-token.guard';
import { Request } from 'express';
import { SETTINGS } from '../../../settings';
import { SessionDeviceViewDto } from '../dto/view-dto/session-device.view-dto';
import { SessionsQueryRepository } from '../infrastructure/query/sessions.query-repository';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteDeviceCommand } from '../application/use-cases/delete-device.use-case';
import { DeleteDevicesExcludeCurrentCommand } from '../application/use-cases/delete-devices-exclude-current.use-case';

@Controller(SECURITY_API_PATH.ROOT_URL)
export class SecurityController {
  constructor(
    private sessionsQueryRepository: SessionsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get(SECURITY_API_PATH.DEVICES)
  @UseGuards(RefreshAuthGuard)
  async getAllDevices(
    @Req() req: Request & { userId: string },
  ): Promise<SessionDeviceViewDto[]> {
    return this.sessionsQueryRepository.getAllDevices(req.userId);
  }

  //TODO change deviceId param to Types.ObjectId
  @Delete(`${SECURITY_API_PATH.DEVICES}/:id`)
  @UseGuards(RefreshAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevice(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
  ): Promise<void> {
    return await this.commandBus.execute(
      new DeleteDeviceCommand(
        id,
        req.userId,
        req.cookies[SETTINGS.REFRESH_TOKEN_NAME].replace('refreshToken=', ''),
      ),
    );
  }

  @Delete(SECURITY_API_PATH.DEVICES)
  @UseGuards(RefreshAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevicesExcludeCurrent(@Req() req: Request): Promise<void> {
    return await this.commandBus.execute(
      new DeleteDevicesExcludeCurrentCommand(
        req.cookies[SETTINGS.REFRESH_TOKEN_NAME].replace('refreshToken=', ''),
      ),
    );
  }
}
