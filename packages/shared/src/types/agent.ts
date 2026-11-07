import type { Language } from './language';

export interface Agent {
  id: string;
  name: string;
  email: string;
  language: Language | null;
  createdAt: string;
}
