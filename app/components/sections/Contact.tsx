import { ButtonLink } from "~/components/ui/Button";
import { CopyEmail } from "~/components/ui/CopyEmail";
import { Section } from "~/components/ui/Section";
import { profile } from "~/content/profile";

const projectMail = `mailto:${profile.email}?subject=${encodeURIComponent("Project enquiry")}`;
const hiringMail = `mailto:${profile.email}?subject=${encodeURIComponent("Role enquiry")}`;

export function Contact() {
  return (
    <Section id="contact" index="06" label="Contact" title="Hiring, or have something to build? Let's talk.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="reveal flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h3 className="font-display text-xl font-semibold tracking-tight">Hiring?</h3>
          <p className="text-muted">
            I'm open to senior React Native, tech lead and full-stack roles. The CV has the full history.
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
          href={`mailto:${profile.email}`}
          className="font-mono text-sm text-fg underline decoration-line underline-offset-4 hover:decoration-accent"
        >
          {profile.email}
        </a>
        <CopyEmail />
      </p>
    </Section>
  );
}
