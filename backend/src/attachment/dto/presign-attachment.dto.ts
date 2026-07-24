import { IsString, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

export class PresignAttachmentDto {
  @IsString() @MinLength(1) @MaxLength(255) fileName!: string;
  @IsString() @MinLength(1) @MaxLength(255) mimeType!: string;
  @IsInt() @Min(1) @Max(MAX_ATTACHMENT_SIZE) fileSize!: number;
}
