import type { ProjectStatus } from "~/content/projects";

export function StatusBadge({ status, className = "" }: { status: ProjectStatus; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-raised px-2.5 py-1 font-mono text-xs text-fg ${className}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${status === "Live" ? "bg-accent" : "border border-muted"}`}
      />
      {status}
    </span>
  );
}
