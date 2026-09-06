import { z } from 'zod';
import type { Agent } from '../types/agent';

export const agentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AgentLoginInput = z.infer<typeof agentLoginSchema>;

export interface AgentLoginResponse {
  message: string;
  agent: Agent;
}

export interface TokenRefreshResponse {
  message: string;
  agent: Agent;
}
