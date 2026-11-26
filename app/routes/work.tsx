import { Link } from "react-router";

import { NotFound } from "~/components/NotFound";
import { ButtonLink } from "~/components/ui/Button";
import { PhoneFrame } from "~/components/ui/PhoneFrame";
import { TagList } from "~/components/ui/Tag";
import { getProject, projects } from "~/content/projects";
import { seo } from "~/lib/seo";

import type { Route } from "./+types/work";

export function meta({ params }: Route.MetaArgs) {
  const project = getProject(params.slug);
  if (!project) return seo({ title: "Page not found", description: "This page does not exist.", path: "/" });
  return seo({ title: project.name, description: project.summary, path: `/work/${project.slug}` });
}

export default function Work({ params }: Route.ComponentProps) {
  const project = getProject(params.slug);
  if (!project) return <NotFound />;

  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  const facts = [
    { label: "Role", value: project.role },
    { label: "Company", value: project.company },
    { label: "Period", value: project.period },
    { label: "Platforms", value: project.platforms },
  ];

  return (
    <article className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
      <Link to="/#work" className="font-mono text-xs text-muted transition-colors hover:text-fg">
        ← All work
      </Link>

      <header className="mt-8 grid gap-10 lg:grid-cols-[1fr_16rem] lg:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Case study</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {project.name}
          </h1>
          <p className="mt-5 max-w-2xl text-xl text-muted">{project.summary}</p>
          {project.links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {project.links.map((link) => (
                <ButtonLink key={link.href} href={link.href} variant="secondary">
                  {link.label} ↗
                </ButtonLink>
              ))}
            </div>
          )}
        </div>
        {project.screenshots[0] && (
          <PhoneFrame
            name={project.name}
            tint={project.tint}
            screenshot={project.screenshots[0]}
            className="hidden w-full lg:block"
          />
        )}
      </header>

      <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-surface p-5">
            <dt className="font-mono text-xs text-muted">{fact.label}</dt>
            <dd className="mt-2 font-medium">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-16 grid gap-14 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-14">
          <section aria-labelledby="overview">
            <h2 id="overview" className="font-display text-2xl font-semibold tracking-tight">
              Overview
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{project.overview}</p>
          </section>

          <section aria-labelledby="contributions">
            <h2 id="contributions" className="font-display text-2xl font-semibold tracking-tight">
              What I worked on
            </h2>
            <ol className="mt-6 divide-y divide-line border-y border-line">
              {project.contributions.map((item, i) => (
                <li key={item} className="reveal flex gap-5 py-4">
                  <span className="font-mono text-xs leading-7 text-accent" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ol>
          </section>

          {project.screenshots.length > 1 && (
            <section aria-labelledby="screens">
              <h2 id="screens" className="font-display text-2xl font-semibold tracking-tight">
                Screens
              </h2>
              <ul className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
                {project.screenshots.map((shot) => (
                  <li key={shot.src} className="reveal">
                    <PhoneFrame name={project.name} tint={project.tint} screenshot={shot} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-10">
          {project.outcomes.length > 0 && (
            <section aria-labelledby="outcomes">
              <h2 id="outcomes" className="font-mono text-xs uppercase tracking-widest text-muted">
                Results
              </h2>
              <dl className="mt-4 space-y-4">
                {project.outcomes.map((outcome) => (
                  <div
                    key={outcome.label}
                    className="flex flex-col-reverse rounded-2xl border border-line bg-surface p-5"
                  >
                    <dt className="text-sm text-muted">{outcome.label}</dt>
                    <dd className="font-display text-4xl font-semibold tracking-tight">{outcome.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section aria-labelledby="stack">
            <h2 id="stack" className="font-mono text-xs uppercase tracking-widest text-muted">
              Stack
            </h2>
            <div className="mt-4">
              <TagList items={project.stack} label={`${project.name} tech stack`} />
            </div>
          </section>
        </aside>
      </div>

      <nav aria-label="Next case study" className="mt-20 border-t border-line pt-10">
        <p className="font-mono text-xs text-muted">Next project</p>
        <Link
          to={`/work/${next.slug}`}
          className="mt-3 inline-block font-display text-3xl font-semibold tracking-tight transition-colors hover:text-accent sm:text-4xl"
        >
          {next.name} →
        </Link>
      </nav>
    </article>
  );
}
