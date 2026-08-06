import { PartialType } from '@nestjs/mapped-types';
import { CreateRedirectDto } from './create-redirect.dto.js';

export class UpdateRedirectDto extends PartialType(CreateRedirectDto) {}
