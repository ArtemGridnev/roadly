import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWidgetFeatureRequestDto {
  @IsString()
  @IsNotEmpty()
  readonly title!: string;

  @IsString()
  @IsNotEmpty()
  readonly description!: string;

  @IsOptional()
  @IsString()
  readonly category?: string;
}
