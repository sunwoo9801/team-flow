import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
export class CreateCardDto {
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() assigneeId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
