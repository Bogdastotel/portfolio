import type { Config } from "@react-router/dev/config";

import { projects } from "./app/content/projects";

export default {
  // No runtime server: every page is built to static HTML.
  ssr: false,
  prerender: ["/", "/play", ...projects.map((project) => `/work/${project.slug}`)],
} satisfies Config;
