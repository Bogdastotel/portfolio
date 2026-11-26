import { Link } from "react-router";

type Variant = "primary" | "secondary";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "border border-line bg-surface text-fg hover:border-muted",
};

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
} & ({ to: string; href?: never; download?: never } | { href: string; to?: never; download?: boolean });

/** `to` for in-app routes, `href` for files, mailto and external links. */
export function ButtonLink({ children, variant = "primary", className = "", ...rest }: Props) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (rest.to !== undefined) {
    return (
      <Link to={rest.to} className={classes}>
        {children}
      </Link>
    );
  }

  const external = rest.href.startsWith("http");
  return (
    <a
      href={rest.href}
      download={rest.download}
      className={classes}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
