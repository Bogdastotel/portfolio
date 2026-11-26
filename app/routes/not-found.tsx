import { NotFound } from "~/components/NotFound";
import { seo } from "~/lib/seo";

export function meta() {
  return [
    ...seo({ title: "Page not found", description: "This page does not exist.", path: "/" }),
    { name: "robots", content: "noindex" },
  ];
}

export default function NotFoundRoute() {
  return <NotFound />;
}
