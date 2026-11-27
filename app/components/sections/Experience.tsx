import { Link } from "react-router";

import { Section } from "~/components/ui/Section";
import { experience } from "~/content/experience";

export function Experience() {
  return (
    <Section id="experience" index="03" label="Experience" title="Seven years, from frontend developer to tech lead.">
      <ol className="divide-y divide-line border-y border-line">
        {experience.map((job) => (
          <li key={job.company} className="reveal grid gap-4 py-8 md:grid-cols-[14rem_1fr] md:gap-10">
            <div>
              <p className="font-mono text-xs text-muted">{job.period}</p>
              <p className="mt-2 text-sm text-muted">{job.place}</p>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">{job.company}</h3>
              <p className="mt-1 text-sm text-accent">{job.title}</p>
              <ul className="mt-4 space-y-2 text-muted">
                {job.points.map((point) => (
                  <li
                    key={point}
                    className="relative pl-5 before:absolute before:left-0 before:top-[0.7em] before:h-px before:w-2.5 before:bg-muted"
                  >
                    {point}
                  </li>
                ))}
              </ul>
              {job.apps && (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {job.apps.map((app) => (
                    <li key={app.name} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
                      {app.slug ? (
                        <Link
                          to={`/work/${app.slug}`}
                          className="font-medium underline decoration-line underline-offset-4 transition-colors hover:text-accent"
                        >
                          {app.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{app.name}</span>
                      )}
                      <span className="text-muted"> · {app.note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
