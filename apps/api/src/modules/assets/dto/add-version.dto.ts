import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
