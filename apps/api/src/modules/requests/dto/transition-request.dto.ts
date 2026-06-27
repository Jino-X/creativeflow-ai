import { RequestStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class TransitionRequestDto {
  @IsEnum(RequestStatus)
  toStatus!: RequestStatus;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
