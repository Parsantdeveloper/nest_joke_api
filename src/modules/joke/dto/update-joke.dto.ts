import { CreateJokeDto } from './create-joke.dto.js';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateJokeDto extends PartialType(CreateJokeDto) {}
