import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FeatureRequestsService } from './feature-requests.service';
import { CreateFeatureRequestDto } from './dto/create-feature-request.dto';
import { UpdateFeatureRequestDto } from './dto/update-feature-request.dto';
import { FindFeatureRequestsQueryDto } from './dto/find-feature-requests-query.dto';
import { FeatureRequestResponseDto } from './dto/feature-request-response.dto';

@Controller('feature-requests')
export class FeatureRequestsController {
  constructor(
    private readonly featureRequestsService: FeatureRequestsService,
  ) {}

  @Post()
  create(
    @Body() createFeatureRequestDto: CreateFeatureRequestDto,
  ): Promise<FeatureRequestResponseDto> {
    return this.featureRequestsService.create(createFeatureRequestDto);
  }

  @Get()
  findAll(
    @Query() query: FindFeatureRequestsQueryDto,
  ): Promise<FeatureRequestResponseDto[]> {
    return this.featureRequestsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<FeatureRequestResponseDto> {
    return this.featureRequestsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFeatureRequestDto: UpdateFeatureRequestDto,
  ): Promise<FeatureRequestResponseDto> {
    return this.featureRequestsService.update(id, updateFeatureRequestDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.featureRequestsService.remove(id);
  }
}
