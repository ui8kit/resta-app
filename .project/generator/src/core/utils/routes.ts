export function routeToViewFileName(route: string): string {
  return route === '/' ? 'index.html' : `${route.slice(1)}.html`;
}

