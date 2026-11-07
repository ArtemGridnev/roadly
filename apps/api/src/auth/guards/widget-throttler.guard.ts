import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthenticatedRequest } from '../types/auth-context';

@Injectable()
export class WidgetThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: AuthenticatedRequest): Promise<string> {
    return Promise.resolve(`${req.ip}:${req.workspace?.id}`);
  }
}
