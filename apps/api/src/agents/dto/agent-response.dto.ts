import { Agent, Language } from '@prisma/client';

export class AgentResponseDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly language: Language | null;
  readonly createdAt: Date;

  constructor(agent: Agent) {
    this.id = agent.id;
    this.name = agent.name;
    this.email = agent.email;
    this.language = agent.language;
    this.createdAt = agent.createdAt;
  }

  static fromEntity(agent: Agent): AgentResponseDto {
    return new AgentResponseDto(agent);
  }
}
