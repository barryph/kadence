import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailSender,
  PasswordResetEmailPayload,
} from '../ports/email-sender.port';

@Injectable()
export class NoopEmailSender implements IEmailSender {
  private readonly logger = new Logger(NoopEmailSender.name);
  readonly sentEmails: PasswordResetEmailPayload[] = [];

  sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
    this.sentEmails.push(payload);
    this.logger.log(
      `[NoopEmailSender] Password reset email would be sent to ${payload.recipientEmail}`,
    );
    return Promise.resolve();
  }
}
