import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateJokeDto } from './dto/create-joke.dto.js';
import { UpdateJokeDto } from './dto/update-joke.dto.js';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import slugify from 'slugify';
import { ROUTES, jokePath } from '../../utils/redirect-path.js';

@Injectable()
export class JokeService {
  constructor(
    private prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private generateSlug(title: string): string {
    return slugify(title, { lower: true, strict: true });
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

  async createJoke(input: CreateJokeDto, authorId: string) {
    const slug = this.generateSlug(input.title);
    const existingJoke = await this.prisma.joke.findUnique({
      where: { slug },
    });
    if (existingJoke) {
      throw new ConflictException('Joke with this title already exists');
    }
    const joke = await this.prisma.joke.create({
      data: { title: input.title, content: input.content, slug, authorId },
    });

    await this.revalidatePaths([ROUTES.JOKES, jokePath(slug)]);
    return { joke };
  }

  async getAllJokes() {
    return this.prisma.joke.findMany({
      include: { author: { select: { email: true, id: true } } },
    });
  }

  async getJokeBySlug(slug: string) {
    const joke = await this.prisma.joke.findUnique({ where: { slug } });
    if (!joke) throw new NotFoundException('Joke not found');
    return joke;
  }

  async deleteJoke(slug: string) {
    const joke = await this.prisma.joke.findUnique({ where: { slug } });
    if (!joke) throw new NotFoundException('Joke not found');

    const deletedJoke = await this.prisma.joke.delete({ where: { slug } });
    await this.revalidatePaths([ROUTES.JOKES, jokePath(slug)]);
    return deletedJoke;
  }

  async updateJoke(input: UpdateJokeDto, slug: string) {
    const existingJoke = await this.prisma.joke.findUnique({ where: { slug } });
    if (!existingJoke) {
      throw new NotFoundException('Joke not found');
    }

    const titleChanged = !!input.title && input.title !== existingJoke.title;

    if (!titleChanged) {
      const updatedJoke = await this.prisma.joke.update({
        where: { slug },
        data: input,
      });
      await this.revalidatePaths([ROUTES.JOKES, jokePath(slug)]);
      return updatedJoke;
    }

    if (!input.title)
      throw new ConflictException('Title cannot be empty when changing title');

    const newSlug = this.generateSlug(input.title);
    const slugExists = await this.prisma.joke.findUnique({
      where: { slug: newSlug },
    });
    if (slugExists) {
      throw new ConflictException('Joke with this title already exists');
    }

    const oldPath = jokePath(existingJoke.slug);
    const newPath = jokePath(newSlug);

    const updatedJoke = await this.prisma.$transaction(async (tx) => {
      const joke = await tx.joke.update({
        where: { slug },
        data: { ...input, slug: newSlug },
      });

      await tx.redirect.updateMany({
        where: { to_path: oldPath },
        data: { to_path: newPath },
      });

      await tx.redirect.upsert({
        where: { from_path: oldPath },
        create: {
          from_path: oldPath,
          to_path: newPath,
          type: 'PERMANENT_308',
          active: true,
        },
        update: { to_path: newPath, type: 'PERMANENT_308', active: true },
      });

      await tx.redirect.deleteMany({ where: { from_path: newPath } });

      return joke;
    });

    await this.revalidatePaths([ROUTES.JOKES, oldPath, newPath]);
    return updatedJoke;
  }
}
