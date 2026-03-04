# Plan: Extract GraphQL Logic to `packages/graphql`

**Author**: Senior dev planning  
**Date**: 2025-03-04  
**Status**: Draft

---

## 1. Current State

### 1.1 GraphQL-related files in `apps/dsl`

| Path | Purpose |
|------|---------|
| `src/data/graphql/client.ts` | Generic fetch-based GraphQL client |
| `src/data/graphql/mappers.ts` | WPGraphQL response → `CanonicalContextInput` |
| `src/data/graphql/menu.graphql` | Query `GetMenuItems` |
| `src/data/graphql/promotions.graphql` | Query `GetPromotions` |
| `src/data/graphql/site.graphql` | Query `GetSiteMetadata` |
| `src/data/graphql/codegen.yml` | GraphQL Code Generator config |
| `src/data/adapters/wpgraphql.adapter.ts` | Adapter that uses client + mappers |

### 1.2 Dependencies

- **mappers.ts** imports `CanonicalContextInput` from `../adapters/types`
- **wpgraphql.adapter.ts** imports fixtures adapter, client, queries, mappers
- **context.ts** imports `loadWpGraphqlContextInput` from adapter

### 1.3 Config & Linters

- **biome.json**: override for `**/*.graphql`
- **workspaces**: `apps/*` only

---

## 2. Target Architecture

```
packages/graphql/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── client.ts
│   ├── queries/ (menu, promotions, site — as .ts with embedded strings)
│   ├── mappers.ts
│   └── wpgraphql.adapter.ts
└── codegen.yml (optional)
```

---

## 3. Key Design Decisions

| Decision | Choice |
|----------|--------|
| CanonicalContextInput | Keep in apps/dsl; graphql package accepts it as generic or defines minimal interface. Mapper returns compatible shape. |
| .graphql?raw | Embed query strings in TS (no Vite-specific imports in library) |
| Fallback | `loadWpGraphqlContextInput({ endpoint, getFallback })` — DI from apps/dsl |

---

## 4. Implementation Phases

### Phase 1: Create package scaffold
- package.json, tsconfig.json
- Add `packages/*` to root workspaces

### Phase 2: Move code
- client.ts, mappers.ts
- Queries as embedded strings in queries/*.ts
- wpgraphql.adapter.ts with DI signature

### Phase 3: Update apps/dsl
- Thin adapter wrapper
- Add @ui8kit/graphql dependency
- Remove src/data/graphql/

### Phase 4: Config
- biome.json: add packages/**
- finalize-dist: add @ui8kit/graphql to react deps when data imports it

---

## 5. CanonicalContextInput Strategy

**Recommended**: Define `CanonicalContextInput`-compatible interface in packages/graphql. The mapper returns that shape. apps/dsl imports types from adapters/types and casts. No circular deps.

Alternative: Move types to @ui8kit/sdk if SDK already has similar structures.
