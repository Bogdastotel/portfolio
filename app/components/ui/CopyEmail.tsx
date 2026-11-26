import { useState } from "react";

import { profile } from "~/content/profile";

export function CopyEmail() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the mailto link beside this button still works.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full border border-line bg-surface px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-muted hover:text-fg"
    >
      <span aria-live="polite">{copied ? "Copied" : "Copy email"}</span>
    </button>
  );
}
