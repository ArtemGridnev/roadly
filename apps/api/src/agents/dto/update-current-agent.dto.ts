import { Language } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCurrentAgentDto {
  @IsEnum(Language)
  readonly language!: Language;
}
