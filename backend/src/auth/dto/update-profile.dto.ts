import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '이름은 2자 이상이어야 합니다.' })
  @MaxLength(50)
  name?: string;
}
