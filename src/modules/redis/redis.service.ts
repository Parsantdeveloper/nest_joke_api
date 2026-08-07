import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { ConfigService } from '@nestjs/config';
import { RedirectType } from '../../generated/prisma/enums.js';

export interface CachedRedirect {
  to: string;
  status: 307 | 308;
}

const KEY_PREFIX = 'redirect:';
const SAFETY_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — self-heal, not the source of truth

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis({
      url: this.config.getOrThrow<string>('UPSTASH_REDIS_REST_URL'),
      token: this.config.getOrThrow<string>('UPSTASH_REDIS_REST_TOKEN'),
    });
  }

  private key(fromPath: string): string {
    return `${KEY_PREFIX}${fromPath}`;
  }

  statusCodeFor(type: RedirectType): 307 | 308 {
    return type === RedirectType.PERMANENT_308 ? 308 : 307;
  }

  async setRedirect(
    fromPath: string,
    toPath: string,
    type: RedirectType,
  ): Promise<void> {
    const value: CachedRedirect = {
      to: toPath,
      status: this.statusCodeFor(type),
    };
    try {
      await this.client.set(this.key(fromPath), value, {
        ex: SAFETY_TTL_SECONDS,
      });
    } catch (error) {
      // Redis is a cache, not the source of truth — never let a cache
      // failure block or fail the actual DB mutation that called this.
      console.error(`Redis set failed for "${fromPath}":`, error);
    }
  }

  async deleteRedirect(fromPath: string): Promise<void> {
    try {
      await this.client.del(this.key(fromPath));
    } catch (error) {
      console.error(`Redis del failed for "${fromPath}":`, error);
    }
  }

  async deleteRedirects(fromPaths: string[]): Promise<void> {
    const unique = [...new Set(fromPaths)];
    if (unique.length === 0) return;
    try {
      await this.client.del(...unique.map((p) => this.key(p)));
    } catch (error) {
      console.error('Redis bulk del failed:', error);
    }
  }
}
