import { Link } from "react-router";

import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { profile } from "~/content/profile";

const nav = [
  { label: "Work", to: "/#work" },
  { label: "Services", to: "/#services" },
  { label: "Experience", to: "/#experience" },
  { label: "About", to: "/#about" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="font-display text-base font-semibold tracking-tight">
          {profile.name}
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-7 text-sm text-muted">
            {nav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition-colors hover:text-fg">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/#contact"
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            Let's talk
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
