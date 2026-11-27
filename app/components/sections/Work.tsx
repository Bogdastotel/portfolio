import { Link } from "react-router";

import { PhoneFrame } from "~/components/ui/PhoneFrame";
import { ProjectDoodles } from "~/components/ui/ProjectDoodles";
import { Section } from "~/components/ui/Section";
import { TagList } from "~/components/ui/Tag";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { featuredProjects, moreProjects } from "~/content/projects";

export function Work() {
  return (
    <Section id="work" index="01" label="Selected work" title="Apps in people's hands, and the systems behind them.">
      <ul className="grid gap-6 md:grid-cols-2">
        {featuredProjects.map((project) => (
          <li key={project.slug} className="reveal">
            <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-muted">
              <div
                aria-hidden={project.screenshots.length === 0}
                className="relative flex h-56 justify-center overflow-hidden pt-8"
                style={{ background: `linear-gradient(180deg, ${project.tint[0]}22, transparent)` }}
              >
                <ProjectDoodles slug={project.slug} tint={project.tint} />
                <PhoneFrame
                  name={project.name}
                  tint={project.tint}
                  screenshot={project.screenshots[0]}
                  transitionName={`phone-${project.slug}`}
                  className="w-40 shrink-0 self-start transition-transform duration-300 group-hover:-translate-y-2"
                />
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs text-muted">
                    {project.company} · {project.role}
                  </p>
                  {project.status && <StatusBadge status={project.status} />}
                </div>
                <h3 className="font-display text-2xl font-semibold tracking-tight">
                  <Link to={`/work/${project.slug}`} viewTransition className="after:absolute after:inset-0">
                    {project.name}
                  </Link>
                </h3>
                <p className="text-muted">{project.summary}</p>
                <div className="mt-auto pt-2">
                  <TagList items={project.stack.slice(0, 4)} label={`${project.name} tech stack`} />
                </div>
                <p className="text-sm font-medium text-accent" aria-hidden="true">
                  Read case study →
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {moreProjects.length > 0 && (
        <div className="mt-16">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted">More work</h3>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {moreProjects.map((project) => (
              <li key={project.slug} className="reveal">
                <article className="relative flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-muted">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-xs text-muted">
                      {project.company} · {project.period}
                    </p>
                    {project.status && <StatusBadge status={project.status} />}
                  </div>
                  <h4 className="font-display text-lg font-semibold tracking-tight">
                    <Link to={`/work/${project.slug}`} viewTransition className="after:absolute after:inset-0">
                      {project.name}
                    </Link>
                  </h4>
                  <p className="text-sm text-muted">{project.summary}</p>
                  <div className="mt-auto pt-1">
                    <TagList items={project.stack.slice(0, 3)} label={`${project.name} tech stack`} />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
