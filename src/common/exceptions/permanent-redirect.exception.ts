import { HttpException } from '@nestjs/common';

export class PermanentRedirectException extends HttpException {
  constructor(public readonly newSlug: string) {
    super('Moved Permanently', 301);
  }
}
