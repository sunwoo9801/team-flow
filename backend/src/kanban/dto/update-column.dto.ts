import { IsString, MinLength, MaxLength } from 'class-validator';
export class UpdateColumnDto {
  @IsString() @MinLength(1) @MaxLength(100) title!: string;
}
