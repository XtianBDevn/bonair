# WordPress CMS push (stub)

Bon Air can push published GEO page content to a client WordPress site via a companion plugin webhook.

## Endpoint

```http
POST /api/cms/push
Content-Type: application/json
```

### Session auth (in-app)

Use the normal Bon Air session cookies after login. Body:

```json
{
  "geoPageId": "<uuid>"
}
```

### Webhook auth (WordPress plugin)

When `CMS_WEBHOOK_SECRET` is set, the plugin must send:

| Header | Value |
|--------|--------|
| `X-BonAir-Signature` | `sha256=<hmac_hex>` |
| `Content-Type` | `application/json` |

HMAC is computed over the **raw request body**:

```
sha256 = HMAC-SHA256(CMS_WEBHOOK_SECRET, rawBody)
```

Body for webhook mode:

```json
{
  "tenantId": "<uuid>",
  "geoPageId": "<uuid>"
}
```

## Response (202)

```json
{
  "mode": "stub",
  "message": "CMS push accepted (stub)...",
  "tenantId": "...",
  "payload": { "geoPageId": "...", "slug": "...", "title": "...", "content": {} }
}
```

Production will call the WP REST API with a plugin-issued token.

## Environment

| Variable | Purpose |
|----------|---------|
| `CMS_WEBHOOK_SECRET` | Shared secret for HMAC signing (min 32 chars recommended) |

## Example (curl, session)

```bash
# After login — cookies in cookie.txt
curl -s -b cookie.txt -X POST http://localhost:3001/api/cms/push \
  -H "Content-Type: application/json" \
  -d '{"geoPageId":"<published-page-uuid>"}'
```

## Example (curl, webhook)

```bash
BODY='{"tenantId":"<tenant-uuid>","geoPageId":"<page-uuid>"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$CMS_WEBHOOK_SECRET" | sed 's/^.*= /sha256=/')

curl -s -X POST http://localhost:3001/api/cms/push \
  -H "Content-Type: application/json" \
  -H "X-BonAir-Signature: $SIG" \
  -d "$BODY"
```
