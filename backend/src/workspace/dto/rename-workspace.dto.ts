import { IsString, MinLength, MaxLength } from 'class-validator';

export class RenameWorkspaceDto {
  @IsString()
  @MinLength(1, { message: '워크스페이스 이름을 입력해 주세요.' })
  @MaxLength(50)
  name!: string;
}
