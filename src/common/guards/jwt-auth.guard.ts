import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token: string = request.cookies?.['accessToken'] as string;

    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
