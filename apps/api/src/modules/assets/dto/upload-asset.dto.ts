import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UploadAssetDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
