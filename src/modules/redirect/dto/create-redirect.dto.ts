import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { RedirectType } from '../../../generated/prisma/enums.js';

export class CreateRedirectDto {
  @IsString()
  @Matches(/^\//, { message: 'from_path must start with /' })
  from_path: string;

  @IsString()
  @Matches(/^\//, { message: 'to_path must start with /' })
  to_path: string;
  @IsOptional()
  @IsEnum(RedirectType)
  type?: RedirectType;
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
