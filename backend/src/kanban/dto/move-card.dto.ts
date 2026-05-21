import { IsString, IsNumber } from 'class-validator';
export class MoveCardDto {
  @IsString() columnId!: string;
  @IsNumber() position!: number;
}
