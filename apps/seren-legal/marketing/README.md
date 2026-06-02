# Marketing — Seren Legal

Production-ready campaigns, social copy, and landing source docs.

## Deploy email campaigns

Use `campaigns/*/body.html` (table-based, inline-safe) with any ESP:

- **Resend** — HTML + text parts
- **Mailchimp** — paste HTML, preview from `preview.txt`
- **ConvertKit** — broadcast HTML mode

## Campaign schedule

| Campaign | When |
|----------|------|
| 01-welcome-trial | Day 0 |
| 02-feature-spotlight | Day 3 |
| 03-upgrade-nudge | Day 12 |

## Live app

Marketing UI: `apps/web` at `/` and `/pricing`. Widget embed code in Settings.

Set `NEXT_PUBLIC_APP_URL` for production CTA links in email HTML.
