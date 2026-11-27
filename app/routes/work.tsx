import { Link } from "react-router";

import { NotFound } from "~/components/NotFound";
import { ButtonLink } from "~/components/ui/Button";
import { PhoneFrame } from "~/components/ui/PhoneFrame";
import { ProjectDoodles } from "~/components/ui/ProjectDoodles";
import { StatusBadge } from "~/components/ui/StatusBadge";
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
      <Link to="/#work" viewTransition className="font-mono text-xs text-muted transition-colors hover:text-fg">
        ← All work
      </Link>

      <header className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-12">
        <div className="lg:self-center">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">Case study</p>
            {project.status && <StatusBadge status={project.status} />}
          </div>
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
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-surface p-5">
                <dt className="font-mono text-xs text-muted">{fact.label}</dt>
                <dd className="mt-2 font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {project.screenshots[0] && (
          <div
            className="group relative flex items-center justify-center overflow-hidden rounded-2xl border border-line px-8 py-10"
            style={{ background: `linear-gradient(180deg, ${project.tint[0]}33, transparent)` }}
          >
            <ProjectDoodles slug={project.slug} tint={project.tint} />
            <PhoneFrame
              name={project.name}
              tint={project.tint}
              screenshot={project.screenshots[0]}
              transitionName={`phone-${project.slug}`}
              className="relative w-44 transition-transform duration-300 group-hover:-translate-y-2"
            />
          </div>
        )}
        {!project.screenshots[0] && project.cover && (
          <img
            src={project.cover.src}
            alt={project.cover.alt}
            className="aspect-[4/3] w-full rounded-2xl border border-line object-cover lg:aspect-auto lg:h-full lg:min-h-80"
          />
        )}
      </header>

      <div className="mt-16 grid gap-14 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-14">
          <section aria-labelledby="overview">
            <h2 id="overview" className="font-display text-2xl font-semibold tracking-tight">
              Overview
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{project.overview}</p>
          </section>

          {project.story && (
            <section aria-labelledby="challenge" className="grid gap-10 sm:grid-cols-2">
              <div className="reveal">
                <h2 id="challenge" className="font-display text-2xl font-semibold tracking-tight">
                  The challenge
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted">{project.story.challenge}</p>
              </div>
              <div className="reveal">
                <h2 className="font-display text-2xl font-semibold tracking-tight">My approach</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted">{project.story.approach}</p>
              </div>
            </section>
          )}

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
          viewTransition
          className="mt-3 inline-block font-display text-3xl font-semibold tracking-tight transition-colors hover:text-accent sm:text-4xl"
        >
          {next.name} →
        </Link>
      </nav>
    </article>
  );
}
