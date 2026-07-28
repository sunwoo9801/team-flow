import { IsNumber } from 'class-validator';

export class MoveChecklistItemDto {
  @IsNumber() position!: number;
}
