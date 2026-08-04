import { IsString, IsNotEmpty } from 'class-validator';
export class CreateJokeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
