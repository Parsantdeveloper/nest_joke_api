import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateJokeDto } from './dto/create-joke.dto.js';
import { UpdateJokeDto } from './dto/update-joke.dto.js';
import slugify from 'slugify';

@Injectable()
export class JokeService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(title: string): string {
    return slugify(title, { lower: true, strict: true });
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
      throw new NotFoundException('Joke not found');
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

    return await this.prisma.joke.delete({
      where: { slug },
    });
  }

  async updateJoke(input: UpdateJokeDto, slug: string) {
    const existingJoke = await this.prisma.joke.findUnique({
      where: { slug },
    });
    if (!existingJoke) {
      throw new NotFoundException('Joke not found');
    }
    if (!input.title) {
      return await this.prisma.joke.update({
        where: { slug },
        data: input,
      });
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
       let joke= await tx.joke.update({
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
      return updatedJoke;
    }
  }
}
