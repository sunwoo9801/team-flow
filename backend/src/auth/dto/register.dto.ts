import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '유효한 이메일을 입력해 주세요.' })
  email!: string;

  @IsString()
  @MinLength(2, { message: '이름은 2자 이상이어야 합니다.' })
  @MaxLength(50)
  name!: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(100)
  password!: string;
}
