import { profile } from "~/content/profile";

export function Footer() {
  const links = [
    { label: "Email", href: `mailto:${profile.email}` },
    { label: "GitHub", href: profile.github },
    ...(profile.linkedin ? [{ label: "LinkedIn", href: profile.linkedin }] : []),
    { label: "CV", href: profile.cv },
  ];

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {profile.name} · {profile.location}
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="transition-colors hover:text-fg"
                {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
