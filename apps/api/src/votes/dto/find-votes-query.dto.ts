import { IsOptional, IsString } from 'class-validator';

export class FindVotesQueryDto {
  @IsOptional()
  @IsString()
  readonly contactId?: string;
}
