export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-line bg-raised px-3 py-1 font-mono text-xs text-muted">{children}</li>
  );
}

export function TagList({ items, label }: { items: readonly string[]; label: string }) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
    </ul>
  );
}
