# Marketing — Bon Air Local AI

Production-ready campaigns, social copy, and landing source docs.

## Folder structure

```
marketing/
  campaigns/     # Email: subject, preview, body.html, body.txt
  social/        # Platform posts, hashtags, calendar
  landing/       # Source copy for Next.js marketing pages
  assets/        # SVG placeholders for designers
```

## Deploy email campaigns

### Resend
1. Create API key; verify sending domain.
2. Send with HTML from `body.html`, subject from `subject.txt`, plain text from `body.txt`.

### Mailchimp / ConvertKit
Paste `body.html` into the HTML editor; set preview text from `preview.txt`.

## Campaign schedule

| Campaign | When |
|----------|------|
| 01-welcome-trial | Day 0 after signup |
| 02-feature-spotlight | Day 3 |
| 03-upgrade-nudge | Day 12 or ~80% plan usage |

## App URLs

Set `NEXT_PUBLIC_APP_URL` in production. Update CTA links in HTML if using a custom domain.

Live pages: `apps/web` routes `/` and `/pricing`.
