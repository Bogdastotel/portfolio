import { ButtonLink } from "~/components/ui/Button";
import { profile } from "~/content/profile";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-28">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">{profile.roles.join(" · ")}</p>
      <h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
        {profile.headline}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{profile.intro}</p>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink to="/#work">View work →</ButtonLink>
        <ButtonLink href={profile.cv} variant="secondary" download>
          Download CV ↓
        </ButtonLink>
      </div>

      <p className="mt-8 flex items-center gap-2 text-sm text-muted">
        <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
        {profile.location} · {profile.availability}
      </p>

      <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {profile.proof.map((item) => (
          <div key={item.label} className="flex flex-col-reverse gap-2 bg-surface p-6">
            <dt className="text-sm text-muted">{item.label}</dt>
            <dd className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
