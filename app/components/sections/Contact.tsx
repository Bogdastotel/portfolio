import { ButtonLink } from "~/components/ui/Button";
import { CopyEmail } from "~/components/ui/CopyEmail";
import { Section } from "~/components/ui/Section";
import { profile } from "~/content/profile";

const projectMail = `mailto:${profile.email}?subject=${encodeURIComponent("Project enquiry")}`;
const hiringMail = `mailto:${profile.email}?subject=${encodeURIComponent("Role enquiry")}`;
const helloMail = `mailto:${profile.email}?subject=${encodeURIComponent("Hello from your portfolio")}`;

export function Contact() {
  return (
    <Section id="contact" index="06" label="Contact" title="Hiring, or have something to build? Let's talk.">
      <p className="reveal -mt-4 mb-8 flex items-center gap-2 font-mono text-sm text-muted">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
        {profile.availability} · based in {profile.location}
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="reveal flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h3 className="font-display text-xl font-semibold tracking-tight">Hiring?</h3>
          <p className="text-muted">
            I'm open to full-stack, tech lead and senior React Native roles. The CV has the full history.
          </p>
          <div className="mt-auto flex flex-wrap gap-3 pt-4">
            <ButtonLink href={profile.cv} download>
              Download CV ↓
            </ButtonLink>
            <ButtonLink href={hiringMail} variant="secondary">
              Email me
            </ButtonLink>
            {profile.linkedin && (
              <ButtonLink href={profile.linkedin} variant="secondary">
                LinkedIn
              </ButtonLink>
            )}
          </div>
        </div>

        <div className="reveal flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h3 className="font-display text-xl font-semibold tracking-tight">Have a project?</h3>
          <p className="text-muted">
            Tell me what you're building and where it stands. I'll reply with how I can help and what it would take.
          </p>
          <div className="mt-auto flex flex-wrap gap-3 pt-4">
            <ButtonLink href={projectMail}>Start a conversation →</ButtonLink>
          </div>
        </div>
      </div>

      <p className="mt-8 flex flex-wrap items-center gap-3 text-muted">
        <a
          href={helloMail}
          className="font-mono text-sm text-fg underline decoration-line underline-offset-4 hover:decoration-accent"
        >
          {profile.email}
        </a>
        <CopyEmail />
        <span aria-hidden="true" className="text-line">
          /
        </span>
        <a href={profile.github} target="_blank" rel="noreferrer" className="text-sm hover:text-fg">
          GitHub ↗
        </a>
        {profile.linkedin && (
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-sm hover:text-fg">
            LinkedIn ↗
          </a>
        )}
      </p>
    </Section>
  );
}
