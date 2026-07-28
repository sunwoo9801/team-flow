import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: '유효한 이메일을 입력해 주세요.' })
  email!: string;
}
