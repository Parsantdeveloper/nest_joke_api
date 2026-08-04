import { Module } from '@nestjs/common';
import { JokeService } from './joke.service.js';
import { JokeController } from './joke.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [AuthModule],
  controllers: [JokeController],
  providers: [JokeService],
})
export class JokeModule {}
