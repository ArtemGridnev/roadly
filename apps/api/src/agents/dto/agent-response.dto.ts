import { Agent } from '@prisma/client';

export class AgentResponseDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: Date;

  constructor(agent: Agent) {
    this.id = agent.id;
    this.name = agent.name;
    this.email = agent.email;
    this.createdAt = agent.createdAt;
  }

  static fromEntity(agent: Agent): AgentResponseDto {
    return new AgentResponseDto(agent);
  }
}
