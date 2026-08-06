import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.schema.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { JokeModule } from './modules/joke/joke.module.js';
import { APP_FILTER } from '@nestjs/core';
import { RedirectFilter } from './common/filters/redirect.filter.js';
import { RedirectModule } from './modules/redirect/redirect.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        return envSchema.parse(config);
      },
    }),
    PrismaModule,
    AuthModule,
    JokeModule,
    RedirectModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: RedirectFilter }],
})
export class AppModule {}
