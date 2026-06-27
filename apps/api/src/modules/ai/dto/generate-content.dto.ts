import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateContentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  prompt!: string;

  @IsOptional()
  @IsIn(['headline', 'body_copy', 'caption', 'cta', 'brief'])
  kind?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  tone?: string;
}
