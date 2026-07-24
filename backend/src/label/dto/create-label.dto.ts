import { IsString, IsIn, MinLength, MaxLength } from 'class-validator';
import { LABEL_COLORS } from '../label-colors';

export class CreateLabelDto {
  @IsString() @MinLength(1) @MaxLength(30) name!: string;
  @IsIn(LABEL_COLORS) color!: string;
}
