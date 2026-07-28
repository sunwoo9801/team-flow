import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { CardPriority } from '@prisma/client';

export class UpdateCardDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsEnum(CardPriority) priority?: CardPriority;
  @IsOptional() @IsDateString() dueDate?: string | null;
}
