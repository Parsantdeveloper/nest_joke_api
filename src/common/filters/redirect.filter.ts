import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { PermanentRedirectException } from '../exceptions/permanent-redirect.exception.js';

@Catch(PermanentRedirectException)
export class RedirectFilter implements ExceptionFilter {
  catch(exception: PermanentRedirectException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const newUrl = `/joke/${exception.newSlug}`;

    response.status(301).set('Location', newUrl).send();
  }
}
