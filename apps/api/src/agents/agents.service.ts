import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Agent, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
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

  async findByEmail(email: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({ where: { email } });

    if (!agent) {
      throw new NotFoundException(`Agent ${email} not found`);
    }

    return agent;
  }

  async findOne(id: string): Promise<AgentResponseDto> {
    const agent = await this.prisma.agent.findUnique({ where: { id } });

    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found`);
    }

    return AgentResponseDto.fromEntity(agent);
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
