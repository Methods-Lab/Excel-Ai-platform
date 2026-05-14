import type { ChatResponse, IChatService } from '@excellence/shared-types';
import { AIRouter } from '../local-ai/ai-router';

export class ChatService implements IChatService {
  private router: AIRouter;

  constructor(router?: AIRouter) {
    this.router = router ?? new AIRouter();
  }

  async send(prompt: string): Promise<ChatResponse> {
    try {
      const response = await this.router.generate(prompt);
      return { message: response.text };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chat request failed.';
      return { message };
    }
  }
}
