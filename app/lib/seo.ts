import { profile, siteUrl } from "~/content/profile";

type SeoInput = { title?: string; description: string; path: string };

/** Meta descriptors for a page. Absolute-URL tags appear once VITE_SITE_URL is set. */
export function seo({ title, description, path }: SeoInput) {
  const fullTitle = title ? `${title} · ${profile.name}` : `${profile.name} · ${profile.roles.join(" · ")}`;

  const tags: Record<string, unknown>[] = [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { name: "twitter:card", content: "summary_large_image" },
  ];

  if (siteUrl) {
    const url = `${siteUrl}${path === "/" ? "" : path}`;
    tags.push(
      { tagName: "link", rel: "canonical", href: url || siteUrl },
      { property: "og:url", content: url || siteUrl },
      { property: "og:image", content: `${siteUrl}/og/default.png` },
    );
  }

  return tags;
}
