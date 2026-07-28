export interface PasswordResetEmailPayload {
  recipientEmail: string;
  resetToken: string;
}

export interface IEmailSender {
  sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void>;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
