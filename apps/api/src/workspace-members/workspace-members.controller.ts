import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkspaceMembersService } from './workspace-members.service';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { WorkspaceMemberResponseDto } from './dto/workspace-member-response.dto';

@Controller('workspaces/:workspaceId/members')
export class WorkspaceMembersController {
  constructor(
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() createWorkspaceMemberDto: CreateWorkspaceMemberDto,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.workspaceMembersService.create(
      workspaceId,
      createWorkspaceMemberDto,
    );
  }

  @Get()
  findAll(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceMemberResponseDto[]> {
    return this.workspaceMembersService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.workspaceMembersService.findOne(workspaceId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.workspaceMembersService.remove(workspaceId, id);
  }
}
