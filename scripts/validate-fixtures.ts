#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

type SchemaMap = Record<string, object>;

type ValidationTarget = {
  name: string;
  schema: object;
  data: unknown;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function readJson<T>(relativePath: string): T {
  const raw = readFileSync(join(ROOT, relativePath), 'utf-8');
  return JSON.parse(raw) as T;
}

function readSchema(relativePath: string): object {
  return readJson<object>(relativePath);
}

function main(): void {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);

  const schemas: SchemaMap = {
    shared: readSchema('schemas/canonical/shared-types.schema.json'),
    catalogItem: readSchema('schemas/canonical/catalog-item.schema.json'),
    guideItem: readSchema('schemas/canonical/guide-item.schema.json'),
    blogPost: readSchema('schemas/canonical/blog-post.schema.json'),
    promoItem: readSchema('schemas/canonical/promo-item.schema.json'),
    landing: readSchema('schemas/canonical/landing.schema.json'),
    site: readSchema('schemas/canonical/site.schema.json'),
    navigation: readSchema('schemas/canonical/navigation.schema.json'),
    page: readSchema('schemas/canonical/page.schema.json'),
  };

  for (const schema of Object.values(schemas)) {
    ajv.addSchema(schema);
  }

  const menu = readJson<{ title: string; subtitle: string; categories: unknown[]; items: unknown[] }>('fixtures/menu.json');
  const recipes = readJson<{ title: string; subtitle: string; items: unknown[] }>('fixtures/recipes.json');
  const blog = readJson<{ title: string; subtitle: string; posts: unknown[] }>('fixtures/blog.json');
  const promotions = readJson<{ title: string; subtitle: string; items: unknown[] }>('fixtures/promotions.json');
  const landing = readJson<unknown>('fixtures/landing.json');
  const site = readJson<unknown>('fixtures/shared/site.json');
  const navigation = readJson<unknown>('fixtures/shared/navigation.json');
  const page = readJson<unknown>('fixtures/shared/page.json');

  const menuSchema = {
    type: 'object',
    required: ['title', 'subtitle', 'categories', 'items'],
    properties: {
      title: { type: 'string' },
      subtitle: { type: 'string' },
      categories: { type: 'array', items: { $ref: 'https://ui8kit.local/schemas/canonical/shared-types.schema.json#/$defs/Category' } },
      items: { type: 'array', items: { $ref: 'https://ui8kit.local/schemas/canonical/catalog-item.schema.json' } },
    },
    additionalProperties: false,
  };

  const recipesSchema = {
    type: 'object',
    required: ['title', 'subtitle', 'items'],
    properties: {
      title: { type: 'string' },
      subtitle: { type: 'string' },
      items: { type: 'array', items: { $ref: 'https://ui8kit.local/schemas/canonical/guide-item.schema.json' } },
    },
    additionalProperties: false,
  };

  const blogSchema = {
    type: 'object',
    required: ['title', 'subtitle', 'posts'],
    properties: {
      title: { type: 'string' },
      subtitle: { type: 'string' },
      posts: { type: 'array', items: { $ref: 'https://ui8kit.local/schemas/canonical/blog-post.schema.json' } },
    },
    additionalProperties: false,
  };

  const promotionsSchema = {
    type: 'object',
    required: ['title', 'subtitle', 'items'],
    properties: {
      title: { type: 'string' },
      subtitle: { type: 'string' },
      items: { type: 'array', items: { $ref: 'https://ui8kit.local/schemas/canonical/promo-item.schema.json' } },
    },
    additionalProperties: false,
  };

  const targets: ValidationTarget[] = [
    { name: 'fixtures/menu.json', schema: menuSchema, data: menu },
    { name: 'fixtures/recipes.json', schema: recipesSchema, data: recipes },
    { name: 'fixtures/blog.json', schema: blogSchema, data: blog },
    { name: 'fixtures/promotions.json', schema: promotionsSchema, data: promotions },
    { name: 'fixtures/landing.json', schema: schemas.landing, data: landing },
    { name: 'fixtures/shared/site.json', schema: schemas.site, data: site },
    { name: 'fixtures/shared/navigation.json', schema: schemas.navigation, data: navigation },
    { name: 'fixtures/shared/page.json', schema: schemas.page, data: page },
  ];

  let hasError = false;

  for (const target of targets) {
    const validate = ajv.compile(target.schema);
    const valid = validate(target.data);
    if (valid) {
      console.log(`[OK] ${target.name}`);
      continue;
    }

    hasError = true;
    console.error(`[FAIL] ${target.name}`);
    for (const error of validate.errors ?? []) {
      console.error(`  - ${error.instancePath || '/'} ${error.message ?? 'validation error'}`);
    }
  }

  if (hasError) {
    process.exit(1);
  }

  console.log('\nFixture validation passed.\n');
}

main();
