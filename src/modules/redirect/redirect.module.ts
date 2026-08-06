import { Module } from '@nestjs/common';
import { RedirectService } from './redirect.service.js';
import { RedirectController } from './redirect.controller.js';
import { AuthModule } from '../auth/auth.module.js';
@Module({
  imports: [AuthModule],
  controllers: [RedirectController],
  providers: [RedirectService],
})
export class RedirectModule {}
