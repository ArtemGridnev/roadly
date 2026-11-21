import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateWorkspaceIdentityDto {
  @Transform(
    ({ obj }: { obj: UpdateWorkspaceIdentityDto }) => obj.requireSignedIdentity,
  )
  @IsBoolean()
  readonly requireSignedIdentity!: boolean;
}
