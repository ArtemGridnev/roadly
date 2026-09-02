import { AgentResponseDto } from "src/agents/dto/agent-response.dto";

export class AgentLoginResponseDto {
  readonly message: string;
  readonly agent: AgentResponseDto;

  constructor(message: string, agent: AgentResponseDto) {
    this.message = message;
    this.agent = agent;
  }
}