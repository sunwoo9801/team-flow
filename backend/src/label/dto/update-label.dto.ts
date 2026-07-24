import { IsString, IsIn, IsOptional, MinLength, MaxLength } from 'class-validator';
import { LABEL_COLORS } from '../label-colors';

export class UpdateLabelDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(30) name?: string;
  @IsOptional() @IsIn(LABEL_COLORS) color?: string;
}
