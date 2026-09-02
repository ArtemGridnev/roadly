import { AgentResponseDto } from "src/agents/dto/agent-response.dto";

export class TokenRefreshResponseDto {
  readonly message: string;
  readonly agent: AgentResponseDto;

  constructor(message: string, agent: AgentResponseDto) {
    this.message = message;
    this.agent = agent;
  }
}