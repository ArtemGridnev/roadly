import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWidgetFeatureRequestDto {
  @IsString()
  @IsNotEmpty()
  readonly title!: string;

  @IsString()
  @IsNotEmpty()
  readonly description!: string;
}
