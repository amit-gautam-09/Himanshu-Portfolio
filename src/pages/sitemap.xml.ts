/**
 * Sitemap, generated from the routes that actually exist rather than a list
 * kept by hand — a hand-kept one goes stale the first time a slug changes.
 * Priorities and change frequencies follow `05-SITE-SCHEMA.md` §2.
 */
import type { APIRoute } from 'astro';
import { cases } from '../data/cases';

const SITE = 'https://himanshugautam.world';

const routes = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/work', priority: '0.9', changefreq: 'monthly' },
  { path: '/about', priority: '0.8', changefreq: 'yearly' },
  { path: '/contact', priority: '0.7', changefreq: 'yearly' },
  { path: '/cv', priority: '0.7', changefreq: 'monthly' },
  ...cases.map((c) => ({
    path: `/work/${c.slug}`,
    // U5 is in progress and changes; the released boards do not.
    priority: c.status.kind === 'progress' ? '0.7' : '0.8',
    changefreq: c.status.kind === 'progress' ? 'monthly' : 'yearly'
  }))
];

export const GET: APIRoute = () => {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
