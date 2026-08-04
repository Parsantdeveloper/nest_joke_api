import { CreateUserDto } from './create-user.dto.js';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
