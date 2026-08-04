import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}
  getHello(): string {
    return `Hello World! The secret is ${this.configService.get('JWT_SECRET')}`;
  }
}
