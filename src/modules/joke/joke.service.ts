import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateJokeDto } from './dto/create-joke.dto.js';
import { UpdateJokeDto } from './dto/update-joke.dto.js';
import { ConfigService } from '@nestjs/config';
import { PermanentRedirectException } from '../../common/exceptions/permanent-redirect.exception.js';

import axios from 'axios';
import slugify from 'slugify';

@Injectable()
export class JokeService {
  constructor(
    private prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private generateSlug(title: string): string {
    return slugify(title, { lower: true, strict: true });
  }

  private async revalidateSlug(slug: string): Promise<void> {
    try {
      await axios.post(
        `${this.config.getOrThrow<string>('FRONTEND_URL')}/api/revalidate`,
        { slug },
        {
          headers: {
            'x-revalidate-secret':
              this.config.getOrThrow<string>('REVALIDATE_SECRET'),
          },
        },
      );
    } catch (error) {
      console.error(`Revalidation failed for slug "${slug}":`, error);
    }
  }

  private async revalidateSlugs(slugs: string[]): Promise<void> {
    await Promise.allSettled(slugs.map((s) => this.revalidateSlug(s)));
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
      data: {
        title: input.title,
        content: input.content,
        slug,
        authorId,
      },
    });

    await this.prisma.redirect.create({
      data: {
        jokeId: joke.id,
        prev_slug: slug,
        new_slug: slug,
      },
    });
    await this.revalidateSlug(slug);

    return { joke };
  }

  async getAllJokes() {
    return this.prisma.joke.findMany({
      include: {
        author: {
          select: {
            email: true,
            id: true,
          },
        },
      },
    });
  }

  async getJokeBySlug(slug: string) {
    const joke = await this.prisma.joke.findUnique({
      where: { slug },
    });

    if (!joke) {
      const redirect = await this.prisma.redirect.findFirst({
        where: { prev_slug: slug, active: true },
        select: { new_slug: true },
      });

      if (redirect) {
        throw new PermanentRedirectException(redirect.new_slug);
      }
    }
    return joke;
  }

  async deleteJoke(slug: string) {
    const joke = await this.prisma.joke.findUnique({
      where: { slug },
    });

    if (!joke) {
      throw new NotFoundException('Joke not found');
    }
    await this.prisma.redirect.deleteMany({
      where: { jokeId: joke.id },
    });

    const deletedJoke = await this.prisma.joke.delete({
      where: { slug },
    });
    await this.revalidateSlug(slug);
    return deletedJoke;
  }

  async updateJoke(input: UpdateJokeDto, slug: string) {
    const existingJoke = await this.prisma.joke.findUnique({
      where: { slug },
    });
    if (!existingJoke) {
      throw new NotFoundException('Joke not found');
    }
    if (!input.title) {
      const updatedJoke = await this.prisma.joke.update({
        where: { slug },
        data: input,
      });
      await this.revalidateSlug(slug);
      return updatedJoke;
    }
    if (input.title !== existingJoke.title) {
      const newSlug = this.generateSlug(input.title);
      const slugExists = await this.prisma.joke.findUnique({
        where: { slug: newSlug },
      });
      if (slugExists) {
        throw new ConflictException('Joke with this title already exists');
      }

      const updatedJoke = await this.prisma.$transaction(async (tx) => {
        // update joke
        const joke = await tx.joke.update({
          where: { slug },
          data: {
            ...input,
            slug: newSlug,
          },
        });

        const existingRedirects = await tx.redirect.findMany({
          where: { jokeId: existingJoke.id, active: true },
        });
        for (const redirect of existingRedirects) {
          await tx.redirect.update({
            where: { id: redirect.id },
            data: { active: false },
          });
        }

        await tx.redirect.create({
          data: {
            jokeId: existingJoke.id,
            prev_slug: existingJoke.slug,
            new_slug: newSlug,
          },
        });
        return joke;
      });
      await this.revalidateSlugs([existingJoke.slug, newSlug]);
      return updatedJoke;
    }
  }
}
