import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import {
  type DependencyGraphDocument,
  type DependencyGraphEdge,
  type DependencyGraphNode,
  loadBlueprint,
  parseNamedImports,
  readText,
  relPath,
  writeJsonFile,
} from './blueprint-shared';

export interface BuildDependencyGraphOptions {
  cwd: string;
  blueprintFile?: string;
  outputFile?: string;
  silent?: boolean;
}

export interface BuildDependencyGraphResult {
  graphPath: string;
  graph: DependencyGraphDocument;
}

function nodeKey(type: DependencyGraphNode['type'], label: string): string {
  return `${type}:${label}`;
}

function addNode(
  nodes: Map<string, DependencyGraphNode>,
  type: DependencyGraphNode['type'],
  label: string,
  file?: string,
  entity?: string
): string {
  const key = nodeKey(type, file ?? label);
  if (!nodes.has(key)) {
    nodes.set(key, {
      id: key,
      type,
      label,
      file,
      entity,
    });
  }
  return key;
}

function addEdge(edges: Map<string, DependencyGraphEdge>, edge: DependencyGraphEdge): void {
  const key = `${edge.from}::${edge.to}::${edge.relation}`;
  if (!edges.has(key)) {
    edges.set(key, edge);
  }
}

function toMermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function toMermaid(graph: DependencyGraphDocument): string {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const lines = ['flowchart LR'];
  for (const edge of graph.edges) {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) continue;
    lines.push(
      `  ${toMermaidId(from.id)}["${from.label}"] --> ${toMermaidId(to.id)}["${to.label}"]`
    );
  }
  return lines.join('\n');
}

function parseNamedImportsBySpecifier(source: string, expectedSpecifier: string): string[] {
  const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  const names = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = namedImportRegex.exec(source)) !== null) {
    const bindings = match[1]!;
    const specifier = match[2]!;
    if (specifier !== expectedSpecifier) continue;
    for (const rawPart of bindings.split(',')) {
      const part = rawPart.trim();
      if (!part || part.startsWith('type ')) continue;
      const [left] = part.split(/\s+as\s+/);
      const name = left?.replace(/^type\s+/, '').trim();
      if (name && /^[A-Z]/.test(name)) names.add(name);
    }
  }
  return Array.from(names).sort();
}

function inferViewsForRoute(
  routeFilePath: string,
  entityViews: string[],
  exportedViewNameToPath: Map<string, string>
): string[] {
  if (!existsSync(routeFilePath)) return entityViews;
  const source = readText(routeFilePath);
  const imports = parseNamedImports(source);
  const explicitViews = new Set<string>();

  for (const [localName, specifier] of imports.entries()) {
    if (!(specifier === '@/blocks' || specifier.startsWith('@/blocks'))) continue;
    if (!localName.endsWith('View')) continue;
    const path = exportedViewNameToPath.get(localName);
    if (path) explicitViews.add(path);
  }

  if (explicitViews.size > 0) {
    return Array.from(explicitViews).sort();
  }

  const isDetailRouteFile = basename(routeFilePath).toLowerCase().includes('detail');
  const filtered = entityViews.filter((view) =>
    isDetailRouteFile
      ? basename(view).toLowerCase().includes('detail')
      : !basename(view).toLowerCase().includes('detail')
  );
  if (filtered.length > 0) return filtered;
  return entityViews;
}

function buildExportedViewNameMap(cwd: string, views: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const view of views) {
    const absPath = resolve(cwd, view);
    if (!existsSync(absPath)) continue;
    const source = readText(absPath);
    const exportRegex = /export\s+function\s+([A-Za-z0-9_]+)/g;
    let match: RegExpExecArray | null;
    while ((match = exportRegex.exec(source)) !== null) {
      map.set(match[1]!, view);
    }
  }
  return map;
}

function shouldAttachNavigationToPartial(partialSource: string): boolean {
  const normalized = partialSource.toLowerCase();
  return (
    normalized.includes('navitems') ||
    normalized.includes('navigation') ||
    normalized.includes('component="nav"') ||
    normalized.includes('sidebarlinks')
  );
}

export function buildDependencyGraph(options: BuildDependencyGraphOptions): BuildDependencyGraphResult {
  const cwd = resolve(options.cwd);
  const { path: blueprintPath, blueprint } = loadBlueprint(cwd, options.blueprintFile);
  const nodes = new Map<string, DependencyGraphNode>();
  const edges = new Map<string, DependencyGraphEdge>();

  const contextNode = addNode(nodes, 'context', 'context.ts', blueprint.context.file);
  const adapterNode = addNode(nodes, 'adapter', 'fixtures.adapter.ts', blueprint.context.adapter);
  const navigationNode = addNode(nodes, 'navigation', 'navigation.json', blueprint.navigation.source);

  for (const entity of blueprint.entities) {
    const fixtureNode = addNode(
      nodes,
      'fixture',
      `${entity.name}.json`,
      entity.fixture,
      entity.name
    );
    const typeNode = addNode(nodes, 'type', basename(entity.types), entity.types, entity.name);

    addEdge(edges, {
      from: fixtureNode,
      to: adapterNode,
      relation: 'uses-adapter',
      entity: entity.name,
    });
    addEdge(edges, {
      from: adapterNode,
      to: contextNode,
      relation: 'loads-context',
      entity: entity.name,
    });

    const exportedViewNameMap = buildExportedViewNameMap(cwd, entity.views);

    for (const routeFile of entity.routeFiles) {
      const routeNode = addNode(nodes, 'route', basename(routeFile), routeFile, entity.name);
      addEdge(edges, {
        from: contextNode,
        to: routeNode,
        relation: 'registers-route',
        entity: entity.name,
      });

      const routeAbsPath = resolve(cwd, routeFile);
      const viewsForRoute = inferViewsForRoute(routeAbsPath, entity.views, exportedViewNameMap);
      for (const viewFile of viewsForRoute) {
        const viewNode = addNode(nodes, 'view', basename(viewFile), viewFile, entity.name);
        addEdge(edges, {
          from: routeNode,
          to: viewNode,
          relation: 'renders-view',
          entity: entity.name,
        });
        addEdge(edges, {
          from: viewNode,
          to: typeNode,
          relation: 'uses-type',
          entity: entity.name,
        });

        const viewAbsPath = resolve(cwd, viewFile);
        if (!existsSync(viewAbsPath)) continue;
        const viewSource = readText(viewAbsPath);
        const componentImports = [
          ...parseNamedImportsBySpecifier(viewSource, '@ui8kit/core'),
          ...parseNamedImportsBySpecifier(viewSource, '@/components'),
        ];

        for (const componentName of componentImports) {
          const componentNode = addNode(nodes, 'component', componentName, undefined, entity.name);
          addEdge(edges, {
            from: viewNode,
            to: componentNode,
            relation: 'imports-component',
            entity: entity.name,
          });
        }
      }
    }
  }

  for (const partial of blueprint.partials) {
    const partialAbsPath = resolve(cwd, partial.file);
    if (!existsSync(partialAbsPath)) continue;
    const partialSource = readText(partialAbsPath);
    if (!shouldAttachNavigationToPartial(partialSource)) continue;
    const partialNode = addNode(nodes, 'partial', partial.name, partial.file);
    addEdge(edges, {
      from: navigationNode,
      to: partialNode,
      relation: 'drives-partial',
    });
  }

  const graph: DependencyGraphDocument = {
    generatedAt: new Date().toISOString(),
    blueprintPath: relPath(cwd, blueprintPath),
    nodes: Array.from(nodes.values()).sort((a, b) => a.id.localeCompare(b.id)),
    edges: Array.from(edges.values()).sort((a, b) => {
      const byFrom = a.from.localeCompare(b.from);
      if (byFrom !== 0) return byFrom;
      const byTo = a.to.localeCompare(b.to);
      if (byTo !== 0) return byTo;
      return a.relation.localeCompare(b.relation);
    }),
    mermaid: '',
  };
  graph.mermaid = toMermaid(graph);

  const graphPath = resolve(cwd, options.outputFile ?? 'dependency-graph.json');
  writeJsonFile(graphPath, graph);

  if (!options.silent) {
    console.log(`Dependency graph generated: ${relPath(cwd, graphPath)}`);
    console.log(`Nodes: ${graph.nodes.length}, edges: ${graph.edges.length}`);
  }

  return {
    graphPath,
    graph,
  };
}
