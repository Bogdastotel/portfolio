import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { Config } from "@react-router/dev/config";

import { projects } from "./app/content/projects";

const paths = ["/", "/play", ...projects.map((project) => `/work/${project.slug}`)];

export default {
  // No runtime server: every page is built to static HTML.
  ssr: false,
  prerender: paths,

  // Sitemap and its robots.txt pointer need absolute URLs, so they are only
  // written when VITE_SITE_URL is set (from the shell or a .env file).
  async buildEnd({ viteConfig, reactRouterConfig }) {
    const siteUrl = String(viteConfig.env.VITE_SITE_URL ?? process.env.VITE_SITE_URL ?? "").replace(/\/$/, "");
    if (!siteUrl) return;

    const client = join(reactRouterConfig.buildDirectory, "client");
    const urls = paths.map((path) => `  <url><loc>${siteUrl}${path === "/" ? "/" : path}</loc></url>`).join("\n");

    await writeFile(
      join(client, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    );
    await writeFile(join(client, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  },
} satisfies Config;
