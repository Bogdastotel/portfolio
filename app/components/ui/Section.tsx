type Props = {
  id: string;
  index: string;
  label: string;
  title: string;
  children: React.ReactNode;
};

/** A numbered homepage section: "01 / Selected work" above a display heading. */
export function Section({ id, index, label, title, children }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          <span className="text-accent">{index}</span> / {label}
        </p>
        <h2
          id={`${id}-title`}
          className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          {title}
        </h2>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
