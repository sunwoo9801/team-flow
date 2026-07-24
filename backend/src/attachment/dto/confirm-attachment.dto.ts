import { IsString, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';
import { MAX_ATTACHMENT_SIZE } from './presign-attachment.dto';

export class ConfirmAttachmentDto {
  @IsString() @MinLength(1) @MaxLength(255) fileName!: string;
  @IsString() @MinLength(1) fileKey!: string;
  @IsString() @MinLength(1) @MaxLength(255) mimeType!: string;
  @IsInt() @Min(1) @Max(MAX_ATTACHMENT_SIZE) fileSize!: number;
}
