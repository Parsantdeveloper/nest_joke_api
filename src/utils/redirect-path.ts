export const ROUTES = {
  JOKES: '/jokes',
} as const;

export function jokePath(slug: string): string {
  return `${ROUTES.JOKES}/${slug}`;
}
