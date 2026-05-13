import { Injectable, Logger } from '@nestjs/common';
import { ExpoPushResult, ExpoPushTicket, PushMessage } from './push.types';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const INVALID_TOKEN_ERRORS = new Set(['DeviceNotRegistered', 'InvalidCredentials']);

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  async send(messages: PushMessage[]): Promise<ExpoPushResult> {
    if (!messages.length) {
      return { invalidTokens: [], failed: [] };
    }

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(`Expo push request failed: ${response.status} ${text}`);
        return {
          invalidTokens: [],
          failed: messages.map((message) => ({
            token: message.to,
            message: `Expo push HTTP ${response.status}`,
          })),
        };
      }

      const body = (await response.json()) as { data?: ExpoPushTicket[] };
      return this.toResult(messages, body.data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Expo push error';
      this.logger.warn(`Expo push send failed: ${message}`);
      return {
        invalidTokens: [],
        failed: messages.map((pushMessage) => ({ token: pushMessage.to, message })),
      };
    }
  }

  private toResult(messages: PushMessage[], tickets: ExpoPushTicket[]): ExpoPushResult {
    const invalidTokens: string[] = [];
    const failed: Array<{ token: string; message: string }> = [];

    tickets.forEach((ticket, index) => {
      if (ticket.status !== 'error') {
        return;
      }

      const token = messages[index]?.to;
      if (!token) {
        return;
      }

      const errorCode = ticket.details?.error;
      if (errorCode && INVALID_TOKEN_ERRORS.has(errorCode)) {
        invalidTokens.push(token);
      }
      failed.push({ token, message: ticket.message ?? errorCode ?? 'Expo push ticket failed' });
    });

    return { invalidTokens, failed };
  }
}
