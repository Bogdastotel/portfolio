import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// On Vercel the production domain is known at build time, so the site URL (canonical and Open Graph tags, share
// image, sitemap) needs no manual setup there. An explicit VITE_SITE_URL still wins, for a custom domain or another host.
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
if (!process.env.VITE_SITE_URL && vercelDomain) process.env.VITE_SITE_URL = `https://${vercelDomain}`;

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
