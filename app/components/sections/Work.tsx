import { Link } from "react-router";

import { PhoneFrame } from "~/components/ui/PhoneFrame";
import { Section } from "~/components/ui/Section";
import { TagList } from "~/components/ui/Tag";
import { projects } from "~/content/projects";

export function Work() {
  return (
    <Section id="work" index="01" label="Selected work" title="Apps in people's hands, and the systems behind them.">
      <ul className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <li key={project.slug} className="reveal">
            <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-muted">
              <div
                aria-hidden={project.screenshots.length === 0}
                className="flex h-56 justify-center overflow-hidden pt-8"
                style={{ background: `linear-gradient(180deg, ${project.tint[0]}22, transparent)` }}
              >
                <PhoneFrame
                  name={project.name}
                  tint={project.tint}
                  screenshot={project.screenshots[0]}
                  className="w-40 shrink-0 self-start transition-transform duration-300 group-hover:-translate-y-2"
                />
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <p className="font-mono text-xs text-muted">
                  {project.company} · {project.role}
                </p>
                <h3 className="font-display text-2xl font-semibold tracking-tight">
                  <Link to={`/work/${project.slug}`} className="after:absolute after:inset-0">
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
    </Section>
  );
}
