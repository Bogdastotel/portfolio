import { ButtonLink } from "~/components/ui/Button";

export function NotFound({
  title = "Page not found",
  text = "That link doesn't lead anywhere. The work is all on the homepage.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-start justify-center px-5 sm:px-8">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-md text-muted">{text}</p>
      <div className="mt-8">
        <ButtonLink to="/">Back to homepage</ButtonLink>
      </div>
    </section>
  );
}
