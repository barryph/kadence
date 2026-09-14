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
| `EMAIL_FROM` | no | `Kadence <notifications@mail.kadence.barryph.com>` | `from` identity for every email. Resend only accepts an address on a verified sending domain. |
| `EMAIL_REPLY_TO` | no | `support+codecompletelabs@gmail.com` | `Reply-To` on every email. |
| `EMAIL_PASSWORD_RESET_URL` | no | `https://kadence.barryph.com/reset-password` | Public HTTPS link the reset token is appended to as `?token=`. Must stay on the verified sending domain (see below). |
| `EMAIL_PASSWORD_RESET_DEEP_LINK` | no | `kadence://reset-password` | Custom-scheme deep link the handoff endpoint redirects into. Must match the app's URL scheme (`front-end/app.json`) and the `reset-password` route. |

Account-deletion links are built by the account-management module
(`buildDeleteAccountLink`) and arrive in the payload fully formed, so they need
no additional email configuration.

Secrets live only in `back-end/.env` (gitignored); `.env.example` documents the
shape. Never expose these through `EXPO_PUBLIC_*`.

## Password reset handoff

Resend treats a body link whose host and scheme do not match the From domain as
a link-mismatch signal that pushes the message toward spam. The password reset
email therefore used to carry a raw `kadence://reset-password?token=...` deep
link, and now carries an HTTPS link on the verified sending domain instead:

```
Email
  -> https://kadence.barryph.com/reset-password?token=...
  -> GET /reset-password  (PasswordResetLandingController)
  -> kadence://reset-password?token=...
  -> Kadence reset-password screen
```

`GET /reset-password` (`src/modules/authentication/password-reset-landing.controller.ts`)
is public and deliberately does no work with the token: it builds the deep link
and returns a small document that opens it, with a visible button fallback for
in-app browsers that ignore an automatic scheme change. It never validates,
redeems, or logs the token — email clients and security scanners prefetch links,
and answering differently for a known token would turn the endpoint into a token
oracle. `POST /auth/reset-password` stays the only place a token is redeemed, so
the security model is unchanged.

Because the token is in the page URL, the response is sent with `no-store`,
`no-referrer`, `noindex` and a strict CSP; the page loads no external resources.
Token encoding is shared by the sender and the endpoint
(`appendPasswordResetToken` in `src/shared/email/password-reset-link.ts`), so the
deep link round-trips the token exactly as the email did.

The endpoint depends on `kadence.barryph.com` routing to this backend; that host
is also the API's public origin (`front-end/.env` `EXPO_PUBLIC_SERVER_URL`), so
no extra deployment target is introduced. A universal/app-link setup
(`apple-app-site-association` / `assetlinks.json`) could later open the app
before this endpoint runs, but is not required: this handoff works from any
email client on iOS and Android without an app rebuild.

> **Migration:** `EMAIL_PASSWORD_RESET_URL` used to hold the `kadence://` deep
> link; it now holds the public HTTPS link. A deployment that overrode it with a
> custom-scheme value must drop that override (or repoint it at the HTTPS
> endpoint) and move any scheme override to `EMAIL_PASSWORD_RESET_DEEP_LINK`.

The handoff has no account-deletion equivalent; that flow's static site is
linked directly (see `docs/external-account-deletion.md`).

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
  asserts the request payload, reset-link encoding, config overrides, and error
  translation — no network calls.
- `email.config.spec.ts` covers defaults, overrides, and blank values.
- `password-reset-landing.page.spec.ts` covers the handoff document: the deep
  link, hostile-token escaping, the missing-token state and the CSP nonce.
- `password-reset-landing.controller.spec.ts` covers the endpoint's deep-link
  construction and security headers.
- `email.module.spec.ts` asserts the production `EMAIL_SENDER` binding.
- E2E suites override `EMAIL_SENDER` with `FakeEmailSender`
  (`test/helpers/fake-email-sender.ts`) in `create-test-app.ts`, so they need no
  credentials and stay hermetic while still reading the outbox.
