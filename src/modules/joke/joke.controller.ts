import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  Put,
  Req,
  Res,
  Delete,
  Get,
} from '@nestjs/common';
import { JokeService } from './joke.service.js';
import { CreateJokeDto } from './dto/create-joke.dto.js';
import { UpdateJokeDto } from './dto/update-joke.dto.js';
import { AuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('joke')
export class JokeController {
  constructor(private readonly jokeService: JokeService) {}

  @Get()
  getAllJokes() {
    return this.jokeService.getAllJokes();
  }

  @Get(':slug')
  getJokeBySlug(@Param('slug') slug: string) {
    return this.jokeService.getJokeBySlug(slug);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createJoke(
    @Body() body: CreateJokeDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.jokeService.createJoke(body, user.sub);
  }

  @Put(':slug')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateJoke(@Param('slug') slug: string, @Body() body: UpdateJokeDto) {
    return this.jokeService.updateJoke(body, slug);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteJoke(@Param('slug') slug: string) {
    return this.jokeService.deleteJoke(slug);
  }
}
