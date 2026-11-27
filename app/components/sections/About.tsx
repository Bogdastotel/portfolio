import { Section } from "~/components/ui/Section";
import { profile } from "~/content/profile";

export function About() {
  return (
    <Section id="about" index="05" label="About" title="Full stack, from the database to the App Store.">
      <div className="grid gap-10 md:grid-cols-[14rem_1fr]">
        <div className="reveal">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={`Portrait of ${profile.name}`}
              loading="lazy"
              className="aspect-square w-40 rounded-2xl border border-line object-cover md:w-full"
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid aspect-square w-40 place-items-center rounded-2xl border border-line bg-surface font-display text-4xl font-semibold text-accent md:w-full"
            >
              {profile.initials}
            </div>
          )}
        </div>

        <div className="reveal max-w-2xl space-y-5 text-lg leading-relaxed text-muted">
          {profile.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className="border-t border-line pt-5 text-base">
            <span className="text-fg">{profile.education.degree}</span>
            <br />
            {profile.education.school} · {profile.education.period}
          </p>
        </div>
      </div>
    </Section>
  );
}
