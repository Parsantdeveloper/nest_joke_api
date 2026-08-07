import { PartialType } from '@nestjs/swagger';
import { CreateRedirectDto } from './create-redirect.dto.js';

export class UpdateRedirectDto extends PartialType(CreateRedirectDto) {}
