import ServerError from 'src/shared/ServerError';

/**
 * Raised when a transactional email could not be handed to the email provider.
 *
 * Deliberately provider-agnostic: the Resend SDK's error codes and messages
 * stay behind the `IEmailSender` boundary. Callers either retry or, where an
 * endpoint must not become an account-existence oracle, log and swallow it.
 */
export class EmailDeliveryError extends ServerError {
  constructor() {
    super(
      'EMAIL_DELIVERY_FAILED',
      'Could not send the email. Please try again.',
      502,
    );
  }
}
