import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentResponseDto } from './dto/agent-response.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAgentDto: CreateAgentDto): Promise<AgentResponseDto> {
    const { password, ...rest } = createAgentDto;
    const passwordHash = await hash(password, SALT_ROUNDS);

    try {
      const agent = await this.prisma.agent.create({
        data: { ...rest, passwordHash },
      });

      return AgentResponseDto.fromEntity(agent);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async findAll(): Promise<AgentResponseDto[]> {
    const agents = await this.prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return agents.map(AgentResponseDto.fromEntity);
  }

  async findOne(id: string): Promise<AgentResponseDto> {
    const agent = await this.prisma.agent.findUnique({ where: { id } });

    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found`);
    }

    return AgentResponseDto.fromEntity(agent);
  }

  async update(
    id: string,
    updateAgentDto: UpdateAgentDto,
  ): Promise<AgentResponseDto> {
    await this.findOne(id);

    const { password, ...rest } = updateAgentDto;
    const passwordHash = password
      ? await hash(password, SALT_ROUNDS)
      : undefined;

    try {
      const agent = await this.prisma.agent.update({
        where: { id },
        data: { ...rest, passwordHash },
      });

      return AgentResponseDto.fromEntity(agent);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.agent.delete({ where: { id } });
  }

  private mapKnownError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException('An agent with this email already exists');
    }

    return error;
  }
}
