# Product Image Monitor

This monitor checks product pages for image updates without re-downloading every
image on every run.

## Files

- `web/data/product-image-sources.json` - source list for platform/product pages.
- `web/data/runtime/product-image-state.json` - generated runtime state, ignored by git.
- `web/src/lib/product-images/monitor.ts` - incremental scan logic.
- `web/src/app/api/cron/product-image-scan/route.ts` - cron endpoint.

## Update Strategy

For each enabled source, the scanner:

1. Sends conditional page requests with stored `ETag` and `Last-Modified` values.
2. Treats HTTP `304 Not Modified` as unchanged.
3. Extracts the likely product image from JSON-LD Product schema, Open Graph tags,
   or scored `<img>` tags.
4. Builds a normalized page hash that ignores scripts/styles and includes the
   selected image URL.
5. Sends a lightweight `HEAD` request to the image URL and stores image
   `ETag` / `Last-Modified`.
6. Marks a source as changed only when the source is new, the page hash changes,
   the selected image URL changes, or the image headers change.

This keeps routine cron runs cheap. A full image download/upload should only run
for changed rows.

## Source Config

Add one entry per canonical product page:

```json
{
  "id": "elite-peps-bpc-157",
  "platform": "Elite Peps Australia",
  "product": "BPC-157",
  "pageUrl": "https://example.com/products/bpc-157",
  "enabled": true,
  "selectorHints": ["bpc 157", "10mg"]
}
```

If a site blocks product-page extraction but exposes a stable image URL, set
`imageUrl` directly. The scanner will still check the image headers for changes.

## Cron Endpoint

Call:

```bash
curl -X POST "$APP_URL/api/cron/product-image-scan" \
  -H "x-api-key: $MCP_API_KEY"
```

The endpoint returns changed sources. The next layer can upload only those
changed images to Feishu, then place them into the matching spreadsheet row.

## Feishu Image Insertion Plan

1. Keep the product matrix spreadsheet token and sheet ID in environment
   variables or automation config.
2. Add a stable row key, such as `platform + product`.
3. For each changed image:
   - download the image once,
   - upload it through Feishu media/image upload,
   - call `sheet image add` for the matching row and image column,
   - record the Feishu image token in runtime state.

The monitor already produces the minimal changed set needed by that final step.
