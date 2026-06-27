import { AssetStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewAssetDto {
  @IsEnum(AssetStatus)
  @IsIn([AssetStatus.APPROVED, AssetStatus.REJECTED])
  decision!: AssetStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
