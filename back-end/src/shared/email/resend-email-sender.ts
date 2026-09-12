import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import type { EmailConfig } from './email.config';
import { loadEmailConfig } from './email.config';
import { EmailDeliveryError } from './email.errors';
import {
  renderAccountDeletedEmail,
  renderAccountDeletionEmail,
  renderPasswordResetEmail,
  type EmailContent,
} from './email-templates';
import type {
  AccountDeletedEmailPayload,
  AccountDeletionEmailPayload,
  IEmailSender,
  PasswordResetEmailPayload,
} from './email-sender.port';

/**
 * `IEmailSender` backed by the Resend Email API
 * (https://resend.com/docs/api-reference/emails/send-email).
 *
 * This is the only place the Resend SDK is imported: everything above the port
 * stays provider-agnostic. Resend reports API-level failures in the response
 * body rather than by throwing, so both that and transport failures are
 * translated into `EmailDeliveryError`. The provider's own code/status is
 * logged for operators; reset tokens and deletion links never are.
 */
@Injectable()
export class ResendEmailSender implements IEmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);
  private readonly config: EmailConfig;
  private readonly client: Resend;

  constructor() {
    this.config = loadEmailConfig();
    if (!this.config.resendApiKey) {
      throw new Error('env.RESEND_API_KEY must be set');
    }
    this.client = new Resend(this.config.resendApiKey);
  }

  sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
    return this.send(
      payload.recipientEmail,
      renderPasswordResetEmail(this.buildPasswordResetUrl(payload.resetToken)),
      'password reset',
    );
  }

  sendAccountDeletionEmail(
    payload: AccountDeletionEmailPayload,
  ): Promise<void> {
    return this.send(
      payload.recipientEmail,
      renderAccountDeletionEmail(payload.deletionUrl, payload.expiresInMinutes),
      'account deletion',
    );
  }

  sendAccountDeletedEmail(payload: AccountDeletedEmailPayload): Promise<void> {
    return this.send(
      payload.recipientEmail,
      renderAccountDeletedEmail(),
      'account deleted confirmation',
    );
  }

  /**
   * The single provider call. `emailKind` is used only for operator logs; the
   * recipient is safe to log, the payload's credentials are not.
   */
  private async send(
    recipientEmail: string,
    content: EmailContent,
    emailKind: string,
  ): Promise<void> {
    try {
      const { error } = await this.client.emails.send({
        from: this.config.from,
        to: recipientEmail,
        ...(this.config.replyTo ? { replyTo: this.config.replyTo } : {}),
        subject: content.subject,
        html: content.html,
        text: content.text,
      });

      if (error) {
        this.logger.error(
          `Resend rejected the ${emailKind} email for ${recipientEmail} (${error.name}, status ${error.statusCode ?? 'unknown'}): ${error.message}`,
        );
        throw new EmailDeliveryError();
      }
    } catch (err) {
      if (err instanceof EmailDeliveryError) {
        throw err;
      }
      // Transport-level failure (DNS, timeout, 5xx). The SDK's stack can embed
      // request details, so log it and surface only the generic domain error.
      this.logger.error(
        `Resend request failed while sending the ${emailKind} email for ${recipientEmail}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new EmailDeliveryError();
    }
  }

  private buildPasswordResetUrl(resetToken: string): string {
    const separator = this.config.passwordResetUrl.includes('?') ? '&' : '?';
    return `${this.config.passwordResetUrl}${separator}token=${encodeURIComponent(
      resetToken,
    )}`;
  }
}
