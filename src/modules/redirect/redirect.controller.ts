import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { RedirectService } from './redirect.service.js';
import { CreateRedirectDto } from './dto/create-redirect.dto.js';
import { UpdateRedirectDto } from './dto/update-redirect.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { AuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('redirect')
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAllRedirects(@Query() pagination: PaginationQueryDto) {
    return this.redirectService.getAll(pagination);
  }

  // e.g. GET /redirect/lookup?path=/jokes/old-slug
  @Get('lookup')
  getRedirectByPath(@Query('path') path: string) {
    return this.redirectService.getRedirectByPath(path);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createRedirect(@Body() body: CreateRedirectDto) {
    return this.redirectService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateRedirect(@Param('id') id: string, @Body() body: UpdateRedirectDto) {
    return this.redirectService.updateRedirect(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteRedirect(@Param('id') id: string) {
    return this.redirectService.deleteRedirect(id);
  }
}
