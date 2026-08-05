import { Controller, Req, Post, Body, Get, Res } from '@nestjs/common';
import { type Response, type Request } from 'express';
import { AuthService } from './auth.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signup(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.register(body, res);
  }

  @Post('sign-in')
  async signin(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.login(body, res);
  }

  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken: string = req.cookies['refreshToken'] as string;

    return await this.authService.refreshToken({ refreshToken }, res);
  }

  @Get('session')
  async getSession(@Req() req: Request) {
    const accessToken: string = req.cookies['accessToken'] as string;
    return await this.authService.getSession(accessToken);
  }
}
