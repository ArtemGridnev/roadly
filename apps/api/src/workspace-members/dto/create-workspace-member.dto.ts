import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkspaceMemberDto {
  @IsString()
  @IsNotEmpty()
  readonly agentId!: string;
}
