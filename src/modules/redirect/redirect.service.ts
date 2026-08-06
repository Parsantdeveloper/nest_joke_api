import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreateRedirectDto } from './dto/create-redirect.dto.js';
import { UpdateRedirectDto } from './dto/update-redirect.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { RedirectType } from '../../generated/prisma/enums.js';

@Injectable()
export class RedirectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private statusCodeFor(type: RedirectType) {
    return type === RedirectType.PERMANENT_308 ? 308 : 307;
  }

  private async revalidatePaths(paths: string[]): Promise<void> {
    const uniquePaths = [...new Set(paths)];
    try {
      await axios.post(
        `${this.config.getOrThrow<string>('FRONTEND_URL')}/api/revalidate`,
        { paths: uniquePaths },
        {
          headers: {
            'x-revalidate-secret':
              this.config.getOrThrow<string>('REVALIDATE_SECRET'),
          },
        },
      );
    } catch (error) {
      console.error(
        `Revalidation failed for paths [${uniquePaths.join(', ')}]:`,
        error,
      );
    }
  }

  async create(input: CreateRedirectDto) {
    if (input.from_path === input.to_path) {
      throw new ConflictException('from_path and to_path cannot be the same');
    }

    const existingRedirect = await this.prisma.redirect.findUnique({
      where: { from_path: input.from_path, active: true },
    });
    if (existingRedirect) {
      throw new ConflictException(
        'Redirect with this from_path already exists',
      );
    }

    const redirect = await this.prisma.redirect.create({ data: input });
    await this.revalidatePaths([input.from_path]);
    return { redirect };
  }

  async getAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [redirects, total] = await this.prisma.$transaction([
      this.prisma.redirect.findMany({ skip, take: limit }),
      this.prisma.redirect.count(),
    ]);

    return { redirects, meta: { page, limit, total } };
  }

  async getRedirectByPath(path: string) {
    const redirect = await this.prisma.redirect.findUnique({
      where: { from_path: path },
    });

    if (!redirect || !redirect.active) {
      return { redirect: false };
    }

    return {
      redirect: true,
      to: redirect.to_path,
      status: this.statusCodeFor(redirect.type),
    };
  }

  async updateRedirect(id: string, input: UpdateRedirectDto) {
    const existing = await this.prisma.redirect.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Redirect not found');
    }

    if (input.from_path && input.from_path !== existing.from_path) {
      // was `where: { id }` — that can never detect a real collision.
      // must check by from_path, the field that's actually @unique.
      const conflict = await this.prisma.redirect.findUnique({
        where: { from_path: input.from_path },
      });
      if (conflict) {
        throw new ConflictException(
          'A redirect for this from_path already exists',
        );
      }
    }

    const updated = await this.prisma.redirect.update({
      where: { id },
      data: input,
    });

    const pathsToRevalidate = [existing.from_path];
    if (input.from_path && input.from_path !== existing.from_path) {
      pathsToRevalidate.push(input.from_path);
    }
    await this.revalidatePaths(pathsToRevalidate);

    return updated;
  }

  async deleteRedirect(id: string) {
    const existing = await this.prisma.redirect.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Redirect not found');
    }
    const deleted = await this.prisma.redirect.delete({ where: { id } });
    await this.revalidatePaths([existing.from_path]);
    return deleted;
  }
}
