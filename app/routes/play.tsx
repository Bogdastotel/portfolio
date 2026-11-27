import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { StatusBadge } from "~/components/ui/StatusBadge";
import { profile } from "~/content/profile";
import { getProject, projects } from "~/content/projects";
import { seo } from "~/lib/seo";
import type { Score, World, WorldInput } from "~/play/world";

export function meta() {
  return seo({
    title: "Explore in 3D",
    description: "Drive around a small 3D world and pull up to each project to open its case study.",
    path: "/play",
  });
}

type Status = "loading" | "ready" | "failed";

type PadProps = {
  label: string;
  action: keyof WorldInput;
  onPress: (action: keyof WorldInput, value: boolean) => void;
  children: React.ReactNode;
};

/** On-screen control for touch devices: held down means the input is on. */
function PadButton({ label, action, onPress, children }: PadProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-14 touch-none select-none items-center justify-center rounded-2xl border border-line bg-surface/85 text-xl text-fg backdrop-blur active:bg-accent active:text-accent-fg"
      onPointerDown={() => onPress(action, true)}
      onPointerUp={() => onPress(action, false)}
      onPointerLeave={() => onPress(action, false)}
      onPointerCancel={() => onPress(action, false)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </button>
  );
}

export default function Play() {
  const container = useRef<HTMLDivElement>(null);
  const minimap = useRef<HTMLCanvasElement>(null);
  const world = useRef<World | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [nearSlug, setNearSlug] = useState<string | null>(null);
  const [muted, setMuted] = useState(() => {
    try {
      return typeof localStorage !== "undefined" && localStorage.getItem("play-muted") === "1";
    } catch {
      return false;
    }
  });
  const [music, setMusic] = useState(() => {
    try {
      return typeof localStorage === "undefined" || localStorage.getItem("play-music") !== "0";
    } catch {
      return true;
    }
  });
  const navigate = useNavigate();
  const near = getProject(nearSlug ?? undefined);

  // three.js is loaded only on this page, and only in the browser.
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let cancelled = false;

    import("~/play/world")
      .then(({ createWorld }) => {
        if (cancelled) return;
        world.current = createWorld(element, {
          projects,
          ownerName: profile.name,
          minimap: minimap.current,
          onNear: setNearSlug,
          onScore: setScore,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
      world.current?.dispose();
      world.current = null;
    };
  }, []);

  // Enter opens the project the car is parked next to.
  useEffect(() => {
    if (!nearSlug) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Enter") return;
      if (event.target instanceof HTMLElement && event.target.closest("a, button")) return;
      navigate(`/work/${nearSlug}`);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nearSlug, navigate]);

  // Keep the world's sound in step with the toggle, and remember the choice.
  useEffect(() => {
    if (status !== "ready") return;
    world.current?.setMuted(muted);
    world.current?.setMusic(music);
    try {
      localStorage.setItem("play-muted", muted ? "1" : "0");
      localStorage.setItem("play-music", music ? "1" : "0");
    } catch {
      // Private windows can refuse storage; the toggle still works for this visit.
    }
  }, [muted, music, status]);

  function press(action: keyof WorldInput, value: boolean) {
    if (world.current) world.current.input[action] = value;
  }

  return (
    <section aria-labelledby="play-title" className="relative h-[calc(100dvh-4rem)] min-h-[30rem] overflow-hidden">
      <div ref={container} className="absolute inset-0 touch-none" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="pointer-events-auto max-w-xs rounded-2xl border border-line bg-surface/85 p-4 backdrop-blur">
          <h1 id="play-title" className="font-display text-lg font-semibold tracking-tight">
            Explore in 3D
          </h1>
          <p className="mt-1 text-sm text-muted">
            Drive up to a project to see it. The outer road has a bowling lane, a football pitch, a stunt park and
            bumpers.
          </p>
          {score && (
            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
              <div className="flex gap-1.5">
                <dt>Coins</dt>
                <dd className="text-fg">
                  {score.coins}/{score.coinsTotal}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Pins</dt>
                <dd className="text-fg">{score.pins}/10</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Strikes</dt>
                <dd className="text-fg">{score.strikes}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Goals</dt>
                <dd className="text-fg">{score.goals}</dd>
              </div>
            </dl>
          )}
          <dl className="mt-3 hidden grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs text-muted pointer-fine:grid">
            <dt className="text-fg">WASD / arrows</dt>
            <dd>drive</dd>
            <dt className="text-fg">Space</dt>
            <dd>brake</dd>
            <dt className="text-fg">Enter</dt>
            <dd>open project</dd>
            <dt className="text-fg">H</dt>
            <dd>horn</dd>
            <dt className="text-fg">R</dt>
            <dd>back to start</dd>
          </dl>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="pointer-events-auto flex items-center gap-2">
            {status === "ready" && (
              <button
                type="button"
                aria-pressed={!muted}
                onClick={() => setMuted((value) => !value)}
                className="rounded-full border border-line bg-surface/85 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:border-muted"
              >
                Sound {muted ? "off" : "on"}
              </button>
            )}
            {status === "ready" && !muted && (
              <button
                type="button"
                aria-pressed={music}
                onClick={() => setMusic((value) => !value)}
                className="rounded-full border border-line bg-surface/85 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:border-muted"
              >
                Music {music ? "on" : "off"}
              </button>
            )}
            <Link
              to="/#work"
              className="rounded-full border border-line bg-surface/85 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:border-muted"
            >
              Plain list →
            </Link>
          </div>
          <canvas
            ref={minimap}
            aria-hidden="true"
            className={`size-28 rounded-full sm:size-40 ${status === "ready" ? "" : "invisible"}`}
          />
        </div>
      </div>

      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg p-6 text-center">
          {status === "loading" ? (
            <p className="font-mono text-sm text-muted">Loading the world…</p>
          ) : (
            <div>
              <p className="font-display text-2xl font-semibold tracking-tight">The 3D view could not start here.</p>
              <p className="mt-2 text-muted">This browser or device may not support WebGL.</p>
              <Link to="/#work" className="mt-6 inline-block font-medium text-accent">
                See the projects as a list →
              </Link>
            </div>
          )}
        </div>
      )}

      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-4 sm:bottom-8"
      >
        {near && (
          <article className="pointer-events-auto w-full max-w-md rounded-2xl border border-line bg-surface/95 p-5 shadow-2xl backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs text-muted">
                {near.company} · {near.period}
              </p>
              {near.status && <StatusBadge status={near.status} />}
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">{near.name}</h2>
            <p className="mt-1 text-sm text-muted">{near.summary}</p>
            <Link
              to={`/work/${near.slug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
            >
              Open case study
              <kbd className="hidden rounded border border-accent-fg/30 px-1.5 font-mono text-xs pointer-fine:inline">
                Enter
              </kbd>
            </Link>
          </article>
        )}
      </div>

      {status === "ready" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 hidden items-end justify-between px-4 pointer-coarse:flex">
          <div className="pointer-events-auto flex gap-3">
            <PadButton label="Steer left" action="left" onPress={press}>
              ←
            </PadButton>
            <PadButton label="Steer right" action="right" onPress={press}>
              →
            </PadButton>
          </div>
          <div className="pointer-events-auto flex gap-3">
            <PadButton label="Reverse" action="down" onPress={press}>
              ↓
            </PadButton>
            <PadButton label="Accelerate" action="up" onPress={press}>
              ↑
            </PadButton>
          </div>
        </div>
      )}
    </section>
  );
}
