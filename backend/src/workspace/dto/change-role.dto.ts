import { IsEnum } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class ChangeRoleDto {
  @IsEnum(MemberRole)
  role!: MemberRole;
}
