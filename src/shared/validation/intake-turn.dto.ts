import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProposedSlotDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @Type(() => Number)
  confidence?: number;
}

export class IntakeTurnDto {
  @IsString()
  sessionId!: string;

  @IsString()
  turnId!: string;

  @IsString()
  message!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedSlotDto)
  proposedSlots!: ProposedSlotDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
