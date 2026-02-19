# Platform Map Format

`schemas/platform-map/*.json` defines how canonical fixture fields are mapped to a target CMS/platform data model.

## Structure

```json
{
  "platform": "shopify",
  "version": "2024-01",
  "domains": {
    "catalog": {
      "resource": "product",
      "collection": "collection.products",
      "itemVariable": "product",
      "collectionVariable": "collection.products",
      "fields": {
        "price.display": { "to": "price", "filter": "money" }
      }
    }
  }
}
```

## Keys

- `platform` - target name (`shopify`, `wordpress`, `insales`)
- `version` - API/schema version label
- `domains` - domain-level map (`catalog`, `promo`, `guide`, `blog`)
- `resource` - target platform resource type
- `collection` - default collection expression for loops
- `itemVariable` - loop item variable alias
- `collectionVariable` - normalized collection expression used by template plugins
- `fields` - canonical path to target path mapping

Field mapping supports:

- `to` - target field path
- `filter` - template engine filter suffix (`money`, `img_url: '600x'`)
- `transform` - adapter/build-time transform hint (`to_cents`, `to_float`)
- `skip` - optional boolean to suppress rendering of field

## Notes

- Canonical field paths must match `schemas/canonical/*`.
- `filter` is applied at template generation time.
- `transform` is applied in adapters/import pipelines, not in template plugin rendering.
- Keep maps brand-agnostic. Brand words are handled in `scripts/schemas/brand-mapping.json`.
