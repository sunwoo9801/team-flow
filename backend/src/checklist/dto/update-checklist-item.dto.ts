import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(300) text?: string;
  @IsOptional() @IsBoolean() done?: boolean;
}
