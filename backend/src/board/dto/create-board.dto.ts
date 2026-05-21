import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @MinLength(1, { message: '보드 이름을 입력해 주세요.' })
  @MaxLength(100)
  title!: string;
}
