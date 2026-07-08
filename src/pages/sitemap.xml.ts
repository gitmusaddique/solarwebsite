import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import site from '../../config/site.json';

export const prerender = true;

export const GET: APIRoute = async () => {
  const baseUrl = site.seo.siteUrl;
  const today = new Date().toISOString().split('T')[0];

  // Static pages with optimized metadata for Google and Bing
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'weekly' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/services', priority: '0.9', changefreq: 'monthly' },
    { url: '/subsidy', priority: '0.9', changefreq: 'monthly' },
    { url: '/projects', priority: '0.8', changefreq: 'monthly' },
    { url: '/gallery', priority: '0.7', changefreq: 'weekly' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' },
    { url: '/calculator', priority: '0.9', changefreq: 'monthly' },
    { url: '/contact', priority: '0.9', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  ];

  // Get all active blog posts
  const blogPosts = await getCollection('blog');
  const activeBlogPosts = blogPosts.filter(post => !post.data.draft);

  const xmlEntries = [
    ...staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`),
    ...activeBlogPosts.map(post => `  <url>
    <loc>${baseUrl}/blog/${post.id}</loc>
    <lastmod>${post.data.date.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    },
  });
};
