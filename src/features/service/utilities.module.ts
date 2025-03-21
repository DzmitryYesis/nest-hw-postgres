import { Module } from '@nestjs/common';
import {
  CryptoService,
  EmailNotificationService,
  JwtService,
} from './application';

@Module({
  providers: [CryptoService, EmailNotificationService, JwtService],
  exports: [CryptoService, EmailNotificationService, JwtService],
})
export class UtilitiesApplicationModule {}
