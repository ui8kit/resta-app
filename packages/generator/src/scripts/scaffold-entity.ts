import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  kebabCase,
  pascalCase,
  readJson,
  readText,
  singularize,
  writeJsonFile,
  writeTextFile,
} from './blueprint-shared';
import { scanBlueprint } from './scan-blueprint';

type ParsedField = {
  name: string;
  type: string;
};

export interface ScaffoldEntityOptions {
  cwd: string;
  name: string;
  singular: string;
  fields: string;
  routes?: string;
  layout?: string;
}

export interface ScaffoldEntityResult {
  createdFiles: string[];
  updatedFiles: string[];
  blueprintPath: string;
}

function parseFields(input: string): ParsedField[] {
  const fields: ParsedField[] = [];
  const parts = input
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const [rawName, rawType] = part.split(':').map((token) => token.trim());
    const name = rawName?.replace(/[^a-zA-Z0-9_]/g, '');
    if (!name) continue;
    const type = rawType && rawType.length > 0 ? rawType : 'string';
    fields.push({ name, type });
  }

  return fields;
}

function toTypeScriptType(rawType: string): string {
  const normalized = rawType.trim();
  if (normalized.includes('|')) {
    return normalized
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        if (part === 'string' || part === 'number' || part === 'boolean') return part;
        return `'${part.replace(/'/g, "\\'")}'`;
      })
      .join(' | ');
  }
  if (normalized === 'string' || normalized === 'number' || normalized === 'boolean') {
    return normalized;
  }
  return 'string';
}

function normalizeRoutes(rawRoutes: string | undefined, entityName: string): { list: string; detail: string } {
  const fallback = `/${entityName},/${entityName}/:slug`;
  const routes = (rawRoutes ?? fallback)
    .split(',')
    .map((route) => route.trim())
    .filter(Boolean)
    .map((route) => (route.startsWith('/') ? route : `/${route}`));

  const list = routes.find((route) => !route.includes(':')) ?? `/${entityName}`;
  const detailRoute = routes.find((route) => route.includes(':')) ?? `/${entityName}/:slug`;
  const detail = detailRoute.replace(/:[^/]+$/, ':slug');
  return { list, detail };
}

function assertFileExists(path: string): void {
  if (!existsSync(path)) {
    throw new Error(`Required file not found: ${path}`);
  }
}

function createFile(path: string, content: string, createdFiles: string[]): void {
  if (existsSync(path)) {
    throw new Error(`Cannot scaffold: file already exists: ${path}`);
  }
  writeTextFile(path, content);
  createdFiles.push(path);
}

function updateFile(path: string, updater: (content: string) => string, updatedFiles: string[]): void {
  assertFileExists(path);
  const original = readText(path);
  const next = updater(original);
  if (next !== original) {
    writeTextFile(path, next);
    updatedFiles.push(path);
  }
}

function insertBeforeMarker(source: string, marker: string, snippet: string): string {
  if (source.includes(snippet.trim())) return source;
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    return `${source.trimEnd()}\n${snippet}`;
  }
  return `${source.slice(0, markerIndex)}${snippet}${source.slice(markerIndex)}`;
}

function appendLineIfMissing(source: string, line: string): string {
  if (source.includes(line)) return source;
  return `${source.trimEnd()}\n${line}\n`;
}

function buildTypeFileContent(
  itemTypeName: string,
  fixtureTypeName: string,
  customFields: ParsedField[]
): string {
  const reserved = new Set(['id', 'slug', 'title', 'description']);
  const lines = customFields
    .filter((field) => !reserved.has(field.name))
    .map((field) => `  ${field.name}: ${toTypeScriptType(field.type)};`);

  const customBlock = lines.length > 0 ? `${lines.join('\n')}\n` : '';

  return `export type ${itemTypeName} = {
  id: string;
  slug: string;
  title: string;
  description?: string;
${customBlock}};

export type ${fixtureTypeName} = {
  title: string;
  subtitle: string;
  items: ${itemTypeName}[];
};
`;
}

function buildFixtureContent(entityLabel: string): string {
  return JSON.stringify(
    {
      title: entityLabel,
      subtitle: `${entityLabel} collection`,
      items: [],
    },
    null,
    2
  ) + '\n';
}

function buildListViewContent(
  entityName: string,
  layoutName: string,
  listViewName: string,
  itemTypeName: string,
  fixtureTypeName: string,
  detailRoute: string
): string {
  return `import type { ReactNode } from 'react';
import { ${layoutName} } from '@/layouts';
import {
  Block,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Text,
  Group,
} from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials/DomainNavButton';
import type { NavItem, SidebarLink } from '@/types/navigation';
import type { ${itemTypeName}, ${fixtureTypeName} } from '@/types/${entityName}';

export interface ${listViewName}Props {
  navItems?: NavItem[];
  sidebar?: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  ${entityName}: ${fixtureTypeName};
  sidebarLinks?: SidebarLink[];
}

export function ${listViewName}({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  ${entityName},
}: ${listViewName}Props) {
  const items = ${entityName}.items ?? [];

  return (
    <${layoutName}
      mode="with-sidebar"
      navItems={navItems ?? []}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" gap="6" data-class="${entityName}-page-section">
        <Block component="header" gap="2" data-class="${entityName}-page-header">
          <CardTitle order={2} data-class="${entityName}-page-title">
            <Var name="${entityName}.title" value={${entityName}.title} />
          </CardTitle>
          <If test="${entityName}.subtitle" value={!!${entityName}.subtitle}>
            <CardDescription data-class="${entityName}-page-subtitle">
              <Var name="${entityName}.subtitle" value={${entityName}.subtitle} />
            </CardDescription>
          </If>
        </Block>

        <Grid grid="cols-1" gap="4" data-class="${entityName}-grid">
          <Loop each="items" as="item" data={items}>
            {(item: ${itemTypeName}) => (
              <Card data-class="${entityName}-card">
                <CardHeader>
                  <CardTitle order={4} data-class="${entityName}-card-title">
                    <Var name="item.title" value={item.title} />
                  </CardTitle>
                  <If test="item.description" value={!!item.description}>
                    <CardDescription data-class="${entityName}-card-description">
                      <Var name="item.description" value={item.description ?? ''} />
                    </CardDescription>
                  </If>
                </CardHeader>
                <CardContent>
                  <Group justify="between" items="center" data-class="${entityName}-card-footer">
                    <Text fontSize="sm" textColor="muted-foreground" data-class="${entityName}-card-slug">
                      <Var name="item.slug" value={item.slug} />
                    </Text>
                    <DomainNavButton href={\`${detailRoute.replace(':slug', '${item.slug}')}\`} size="sm" data-class="${entityName}-card-link">
                      Open
                    </DomainNavButton>
                  </Group>
                </CardContent>
              </Card>
            )}
          </Loop>
        </Grid>
      </Block>
    </${layoutName}>
  );
}
`;
}

function buildDetailViewContent(
  entityName: string,
  layoutName: string,
  detailViewName: string,
  itemTypeName: string,
  listRoute: string
): string {
  return `import type { ReactNode } from 'react';
import { ${layoutName} } from '@/layouts';
import { Block, Card, CardHeader, CardTitle, CardDescription, CardContent, Text } from '@ui8kit/core';
import { If, Var } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials/DomainNavButton';
import type { NavItem } from '@/types/navigation';
import type { ${itemTypeName} } from '@/types/${entityName}';

export interface ${detailViewName}Props {
  navItems?: NavItem[];
  sidebar?: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  item?: ${itemTypeName};
}

export function ${detailViewName}({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  item,
}: ${detailViewName}Props) {
  return (
    <${layoutName}
      mode="with-sidebar"
      navItems={navItems ?? []}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" gap="6" data-class="${entityName}-detail-section">
        <DomainNavButton href="${listRoute}" variant="outline" size="sm" data-class="${entityName}-detail-back">
          Back
        </DomainNavButton>

        <Card data-class="${entityName}-detail-card">
          <CardHeader>
            <CardTitle order={2} data-class="${entityName}-detail-title">
              <Var name="item.title" value={item?.title ?? 'Item not found'} />
            </CardTitle>
            <If test="item?.description" value={!!item?.description}>
              <CardDescription data-class="${entityName}-detail-description">
                <Var name="item.description" value={item?.description ?? ''} />
              </CardDescription>
            </If>
          </CardHeader>
          <CardContent>
            <Text fontSize="sm" textColor="muted-foreground" data-class="${entityName}-detail-slug">
              <Var name="item.slug" value={item?.slug ?? ''} />
            </Text>
          </CardContent>
        </Card>
      </Block>
    </${layoutName}>
  );
}
`;
}

function buildListRouteContent(
  listRouteName: string,
  listViewName: string,
  entityName: string
): string {
  return `import { SidebarContent, ${listViewName} } from '@/blocks';
import { context } from '@/data/context';

export function ${listRouteName}() {
  return (
    <${listViewName}
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      ${entityName}={context.${entityName}}
      sidebarLinks={context.sidebarLinks}
    />
  );
}
`;
}

function buildDetailRouteContent(
  detailRouteName: string,
  detailViewName: string,
  entityName: string
): string {
  return `import { useParams } from 'react-router-dom';
import { SidebarContent, ${detailViewName} } from '@/blocks';
import { context } from '@/data/context';

export function ${detailRouteName}() {
  const { slug } = useParams<{ slug: string }>();
  const item = context.${entityName}.items?.find((entry) => entry.slug === slug);

  return (
    <${detailViewName}
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      item={item}
    />
  );
}
`;
}

function updateAdaptersTypes(
  source: string,
  entityName: string,
  itemTypeName: string,
  fixtureTypeName: string
): string {
  let output = source;

  if (!output.includes(`export type ${itemTypeName} = {`)) {
    const canonicalStart = output.indexOf('export type CanonicalContextInput = {');
    const typeBlock = `export type ${itemTypeName} = {
  id: string;
  slug: string;
  title: string;
  description?: string;
};

export type ${fixtureTypeName} = {
  title: string;
  subtitle: string;
  items: ${itemTypeName}[];
};

`;
    if (canonicalStart >= 0) {
      output = `${output.slice(0, canonicalStart)}${typeBlock}${output.slice(canonicalStart)}`;
    } else {
      output = `${output.trimEnd()}\n\n${typeBlock}`;
    }
  }

  const fixturesBlockRegex = /(fixtures:\s*\{)([\s\S]*?)(\n\s*\};)/;
  output = output.replace(fixturesBlockRegex, (full, start, body, end) => {
    if (body.includes(`${entityName}:`)) return full;
    const indentMatch = end.match(/\n(\s*)\};/);
    const closingIndent = indentMatch?.[1] ?? '  ';
    const entryIndent = `${closingIndent}  `;
    const normalizedBody = body.endsWith('\n') ? body : `${body}\n`;
    return `${start}${normalizedBody}${entryIndent}${entityName}: ${fixtureTypeName};${end}`;
  });

  return output;
}

function updateFixturesAdapter(source: string, entityName: string): string {
  let output = source;
  const importLine = `import ${entityName}Data from '../../../fixtures/${entityName}.json';`;
  output = insertBeforeMarker(
    output,
    "import adminData from '../../../fixtures/admin.json';",
    `${importLine}\n`
  );

  const mappingLine = `      ${entityName}: ${entityName}Data as CanonicalContextInput['fixtures']['${entityName}'],`;
  output = insertBeforeMarker(
    output,
    "      admin: adminData as CanonicalContextInput['fixtures']['admin'],",
    `${mappingLine}\n`
  );

  return output;
}

function updateContext(
  source: string,
  entityName: string,
  detailRoute: string
): string {
  let output = source;

  output = output.replace(
    /(const baseContext = createContext<\{)([\s\S]*?)(\}\>\(\{)/,
    (full, start, body, end) => {
      if (body.includes(`${entityName}: CanonicalContextInput['fixtures']['${entityName}'];`)) return full;
      const normalizedBody = body.endsWith('\n') ? body : `${body}\n`;
      return `${start}${normalizedBody}  ${entityName}: CanonicalContextInput['fixtures']['${entityName}'];\n${end}`;
    }
  );

  output = output.replace(/dynamicRoutePatterns:\s*\[([^\]]*)\]/, (_full, inner) => {
    const existing = inner
      .split(',')
      .map((value: string) => value.trim())
      .filter(Boolean)
      .map((value: string) => value.replace(/^['"]|['"]$/g, ''));
    if (!existing.includes(detailRoute)) existing.push(detailRoute);
    const list = existing.map((value: string) => `'${value}'`).join(', ');
    return `dynamicRoutePatterns: [${list}]`;
  });

  output = output.replace(
    /(fixtures:\s*\{)([\s\S]*?)(\n\s*\},\n\s*\}\);)/,
    (full, start, body, end) => {
      if (body.includes(`${entityName}: input.fixtures.${entityName}`)) return full;
      const indentMatch = end.match(/\n(\s*)\}/);
      const closingIndent = indentMatch?.[1] ?? '  ';
      const entryIndent = `${closingIndent}  `;
      const normalizedBody = body.endsWith('\n') ? body : `${body}\n`;
      return `${start}${normalizedBody}${entryIndent}${entityName}: input.fixtures.${entityName},${end}`;
    }
  );

  output = insertBeforeMarker(
    output,
    '  site: baseContext.site,',
    `  ${entityName}: baseContext.fixtures.${entityName},\n`
  );

  output = insertBeforeMarker(
    output,
    '  domains: Object.freeze({',
    `  ${entityName}: baseContext.fixtures.${entityName},\n`
  );

  return output;
}

function updateAppFile(
  source: string,
  listRouteName: string,
  detailRouteName: string,
  entityName: string,
  listRoute: string,
  detailRoute: string
): string {
  let output = source;
  const importListLine = `import { ${listRouteName} } from '@/routes/${entityName}/${listRouteName}';`;
  const importDetailLine = `import { ${detailRouteName} } from '@/routes/${entityName}/DetailPage';`;

  output = insertBeforeMarker(
    output,
    "import { LoginPage } from '@/routes/admin/LoginPage';",
    `${importListLine}\n${importDetailLine}\n`
  );

  const routesSnippet = `      <Route path="${listRoute}" element={<${listRouteName} />} />\n      <Route path="${detailRoute}" element={<${detailRouteName} />} />\n`;
  output = insertBeforeMarker(
    output,
    '      <Route path="/admin" element={<LoginPage />} />',
    routesSnippet
  );

  return output;
}

function updateBlocksIndex(source: string, entityName: string, listViewName: string, detailViewName: string): string {
  let output = source;
  output = appendLineIfMissing(output, `export { ${listViewName} } from './${entityName}/${listViewName}';`);
  output = appendLineIfMissing(output, `export { ${detailViewName} } from './${entityName}/DetailPageView';`);
  return output;
}

function updateTypesIndex(source: string, entityName: string, itemTypeName: string, fixtureTypeName: string): string {
  return appendLineIfMissing(source, `export type { ${itemTypeName}, ${fixtureTypeName} } from './${entityName}';`);
}

function updateNavigationFixture(path: string, entityName: string, label: string, listRoute: string): void {
  const fixture = readJson<Record<string, unknown>>(path);
  const navItems = (Array.isArray(fixture.navItems) ? fixture.navItems : []) as Array<Record<string, unknown>>;
  const sidebarLinks = (Array.isArray(fixture.sidebarLinks) ? fixture.sidebarLinks : []) as Array<Record<string, unknown>>;

  if (!navItems.some((item) => item.url === listRoute)) {
    navItems.push({
      id: entityName,
      title: label,
      url: listRoute,
    });
  }
  if (!sidebarLinks.some((item) => item.href === listRoute)) {
    sidebarLinks.push({
      label,
      href: listRoute,
    });
  }

  const next = {
    ...fixture,
    navItems,
    sidebarLinks,
  };
  writeJsonFile(path, next);
}

function updatePageFixture(
  path: string,
  entityName: string,
  listRoute: string,
  detailRoute: string,
  listRouteName: string,
  detailRouteName: string,
  entityLabel: string,
  singularLabel: string
): void {
  const fixture = readJson<{ page?: Record<string, unknown[]> }>(path);
  const page = fixture.page ?? {};
  const website = Array.isArray(page.website) ? [...page.website] : [];
  const asRecords = website as Array<Record<string, unknown>>;

  if (!asRecords.some((entry) => entry.path === listRoute)) {
    asRecords.push({
      id: entityName,
      domain: 'website',
      title: entityLabel,
      path: listRoute,
      component: listRouteName,
    });
  }
  if (!asRecords.some((entry) => entry.path === detailRoute)) {
    asRecords.push({
      id: `${entityName}-detail`,
      domain: 'website',
      title: singularLabel,
      path: detailRoute,
      component: detailRouteName,
    });
  }

  const next = {
    ...fixture,
    page: {
      ...page,
      website: asRecords,
    },
  };
  writeJsonFile(path, next);
}

export function scaffoldEntity(options: ScaffoldEntityOptions): ScaffoldEntityResult {
  const cwd = resolve(options.cwd);
  const entityName = kebabCase(options.name);
  const singularName = pascalCase(options.singular);
  const entityPascal = pascalCase(entityName);
  const layoutName = options.layout ?? 'MainLayout';
  const parsedFields = parseFields(options.fields);
  const routes = normalizeRoutes(options.routes, entityName);

  const listRouteName = `${entityPascal}Page`;
  const detailRouteName = `${singularName}DetailPage`;
  const listViewName = `${entityPascal}PageView`;
  const detailViewName = `${singularName}DetailPageView`;
  const itemTypeName = `${singularName}Item`;
  const fixtureTypeName = `${entityPascal}Fixture`;

  const typeFilePath = resolve(cwd, `src/types/${entityName}.ts`);
  const fixturePath = resolve(cwd, `fixtures/${entityName}.json`);
  const listViewPath = resolve(cwd, `src/blocks/${entityName}/${listViewName}.tsx`);
  const detailViewPath = resolve(cwd, `src/blocks/${entityName}/DetailPageView.tsx`);
  const listRoutePath = resolve(cwd, `src/routes/${entityName}/${listRouteName}.tsx`);
  const detailRoutePath = resolve(cwd, `src/routes/${entityName}/DetailPage.tsx`);

  const adaptersTypesPath = resolve(cwd, 'src/data/adapters/types.ts');
  const fixturesAdapterPath = resolve(cwd, 'src/data/adapters/fixtures.adapter.ts');
  const contextPath = resolve(cwd, 'src/data/context.ts');
  const navigationPath = resolve(cwd, 'fixtures/shared/navigation.json');
  const pagePath = resolve(cwd, 'fixtures/shared/page.json');
  const blocksIndexPath = resolve(cwd, 'src/blocks/index.ts');
  const typesIndexPath = resolve(cwd, 'src/types/index.ts');
  const appPath = resolve(cwd, 'src/App.tsx');

  for (const requiredPath of [
    adaptersTypesPath,
    fixturesAdapterPath,
    contextPath,
    navigationPath,
    pagePath,
    blocksIndexPath,
    typesIndexPath,
    appPath,
  ]) {
    assertFileExists(requiredPath);
  }

  const createdFiles: string[] = [];
  const updatedFiles: string[] = [];

  createFile(typeFilePath, buildTypeFileContent(itemTypeName, fixtureTypeName, parsedFields), createdFiles);
  createFile(fixturePath, buildFixtureContent(entityPascal), createdFiles);
  createFile(
    listViewPath,
    buildListViewContent(entityName, layoutName, listViewName, itemTypeName, fixtureTypeName, routes.detail),
    createdFiles
  );
  createFile(
    detailViewPath,
    buildDetailViewContent(entityName, layoutName, detailViewName, itemTypeName, routes.list),
    createdFiles
  );
  createFile(listRoutePath, buildListRouteContent(listRouteName, listViewName, entityName), createdFiles);
  createFile(
    detailRoutePath,
    buildDetailRouteContent(detailRouteName, detailViewName, entityName),
    createdFiles
  );

  updateFile(
    adaptersTypesPath,
    (source) => updateAdaptersTypes(source, entityName, itemTypeName, fixtureTypeName),
    updatedFiles
  );
  updateFile(fixturesAdapterPath, (source) => updateFixturesAdapter(source, entityName), updatedFiles);
  updateFile(contextPath, (source) => updateContext(source, entityName, routes.detail), updatedFiles);
  updateFile(
    appPath,
    (source) => updateAppFile(source, listRouteName, detailRouteName, entityName, routes.list, routes.detail),
    updatedFiles
  );
  updateFile(
    blocksIndexPath,
    (source) => updateBlocksIndex(source, entityName, listViewName, detailViewName),
    updatedFiles
  );
  updateFile(
    typesIndexPath,
    (source) => updateTypesIndex(source, entityName, itemTypeName, fixtureTypeName),
    updatedFiles
  );

  updateNavigationFixture(navigationPath, entityName, entityPascal, routes.list);
  updatedFiles.push(navigationPath);
  updatePageFixture(
    pagePath,
    entityName,
    routes.list,
    routes.detail,
    listRouteName,
    detailRouteName,
    entityPascal,
    singularize(singularName)
  );
  updatedFiles.push(pagePath);

  const scan = scanBlueprint({ cwd, silent: true });

  return {
    createdFiles,
    updatedFiles,
    blueprintPath: scan.blueprintPath,
  };
}
