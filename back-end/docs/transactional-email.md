# Transactional Email (Resend)

Transactional email is sent through the [Resend](https://resend.com) Email API
using the official [`resend`](https://www.npmjs.com/package/resend) Node SDK.

## Architecture

All email goes through the `IEmailSender` port in
`src/shared/email/email-sender.port.ts`, injected with the `EMAIL_SENDER` token.
`EmailModule` owns the single binding for the whole app because two bounded
contexts depend on it:

- `authentication` — password reset links.
- `account-management` — the external account-deletion link and the
  post-deletion confirmation.

`ResendEmailSender` (`src/shared/email/resend-email-sender.ts`) is the only file
that imports the Resend SDK, so replacing the provider means adding another
implementation of the port and changing one provider in `email.module.ts` — no
application code changes.

## Configuration

All values are read from the environment by
`src/shared/email/email.config.ts`.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | yes | — | Resend API key ([create one](https://resend.com/api-keys)). The API refuses to start without it. |
| `EMAIL_FROM` | no | `Kadence <kadence+codecompletelabs@gmail.com>` | `from` identity for every email. Resend only accepts an address on a verified sending domain. |
| `EMAIL_REPLY_TO` | no | — | Optional `Reply-To`. Omitted from the message when unset. |
| `EMAIL_PASSWORD_RESET_URL` | no | `kadence://reset-password` | Deep link the reset token is appended to as `?token=`. Must match the app's URL scheme (`front-end/app.json`) and the `reset-password` route. |

Account-deletion links are built by the account-management module
(`buildDeleteAccountLink`) and arrive in the payload fully formed, so they need
no additional email configuration.

Secrets live only in `back-end/.env` (gitignored); `.env.example` documents the
shape. Never expose these through `EXPO_PUBLIC_*`.

## Error handling

Resend reports API-level failures in the response body rather than by throwing,
so `ResendEmailSender` handles both that and transport-level failures, logging
the provider's own code/status for operators and then throwing
`EmailDeliveryError` (`502`, code `EMAIL_DELIVERY_FAILED`). Callers never see
Resend error codes, and reset tokens and deletion links are never logged.

The callers decide what a failure means for their endpoint:

- `AuthenticationService.forgotPassword` and
  `DeletionRequestService.requestDeletion` log and swallow it. Both endpoints
  must answer identically whether or not an address is registered, so surfacing
  a send failure would turn them into an account-existence oracle.
- `AccountDeletionService` swallows the post-deletion confirmation: the account
  is already gone, so the failure cannot be retried and must not turn a
  successful deletion into a `5xx`.

## Testing

- `resend-email-sender.spec.ts` mocks the `resend` module at the boundary and
  asserts the request payload, deep-link encoding, config overrides, and error
  translation — no network calls.
- `email.config.spec.ts` covers defaults, overrides, and blank values.
- `email.module.spec.ts` asserts the production `EMAIL_SENDER` binding.
- E2E suites override `EMAIL_SENDER` with `FakeEmailSender`
  (`test/helpers/fake-email-sender.ts`) in `create-test-app.ts`, so they need no
  credentials and stay hermetic while still reading the outbox.
