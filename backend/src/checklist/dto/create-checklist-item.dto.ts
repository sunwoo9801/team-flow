import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateChecklistItemDto {
  @IsString() @MinLength(1) @MaxLength(300) text!: string;
}
