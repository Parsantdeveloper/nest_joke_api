import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import bcrpt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: CreateUserDto, response: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (user) {
      throw new ConflictException('User already exists');
    }
    const password = await bcrpt.hash(input.password, 10);
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: input.email,
      },
      {
        expiresIn: '7d',
      },
    );
    const hashedRefreshToken = await bcrpt.hash(refreshToken, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: input.email,
        password,
        hashedRefreshToken,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return { accessToken, refreshToken };
  }

  async login(input: CreateUserDto, response: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new ConflictException('User does not exist');
    }
    const isPasswordValid = await bcrpt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('Invalid password');
    }
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: input.email,
      },
      {
        expiresIn: '7d',
      },
    );
    const hashedRefreshToken = await bcrpt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { email: input.email },
      data: { hashedRefreshToken },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    return { accessToken, refreshToken };
  }

  async refreshToken(input: RefreshTokenDto, res: Response) {
    const payload = await this.jwtService.verifyAsync(input.refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { email: payload.sub },
    });
    if (!user) {
      throw new ConflictException('User does not exist');
    }
    if (!user.hashedRefreshToken) {
      throw new ConflictException('Refresh token does not exist');
    }
    const isRefreshTokenValid = await bcrpt.compare(
      input.refreshToken,
      user.hashedRefreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new ConflictException('Invalid refresh token');
    }
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return { refreshToken: input.refreshToken, accessToken };
  }
}
