import { CreateJokeDto } from './create-joke.dto.js';
import { PartialType } from '@nestjs/swagger';

export class UpdateJokeDto extends PartialType(CreateJokeDto) {}
