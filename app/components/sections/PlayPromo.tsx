import { Link } from "react-router";

import { featuredProjects } from "~/content/projects";

/** The road the little car follows, in the illustration's own 320 × 170 units. */
const ROAD = "M -30 128 C 50 128, 78 52, 160 52 S 262 118, 350 92";

const stations = [
  { x: 52, y: 62 },
  { x: 128, y: 96 },
  { x: 196, y: 14 },
  { x: 268, y: 126 },
];

const coins = [
  { x: 92, y: 86 },
  { x: 160, y: 52 },
  { x: 232, y: 82 },
];

/** Hero banner inviting visitors into the drivable 3D version of the portfolio. */
export function PlayPromo() {
  return (
    <aside
      aria-labelledby="play-promo-title"
      className="group relative mt-12 grid overflow-hidden rounded-3xl border border-accent/40 bg-surface transition-colors hover:border-accent md:grid-cols-[1fr_22rem]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_20rem_at_100%_0%,var(--accent),transparent_70%)] opacity-15"
      />

      {/* `isolate` lifts the text above the glow without trapping the link's stretched hit area inside this column. */}
      <div className="isolate p-6 sm:p-8">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
          <span aria-hidden="true" className="relative flex size-2">
            <span className="promo-ping absolute inline-flex size-full rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          Interactive · 3D
        </p>
        <h2
          id="play-promo-title"
          className="mt-4 font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
        >
          <Link to="/play" className="after:absolute after:inset-0">
            Take my portfolio for a drive.
          </Link>
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          A small 3D world built with three.js. Pull up to any project to open it, then try the bowling lane, the stunt
          ramps and the 27 coins.
        </p>
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span
            aria-hidden="true"
            className="pointer-events-none inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-transform group-hover:translate-x-1"
          >
            Start driving →
          </span>
          <span className="font-mono text-xs text-muted">Keyboard or touch · sound optional</span>
        </p>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none relative min-h-40 border-t border-line bg-raised md:border-l md:border-t-0"
      >
        <svg viewBox="0 0 320 170" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
          <path d={ROAD} fill="none" stroke="var(--line)" strokeWidth="26" strokeLinecap="round" />
          <path
            d={ROAD}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="1.5"
            strokeDasharray="7 9"
            opacity="0.6"
            className="promo-dashes"
          />

          {stations.map((station, i) => {
            const [light, deep] = featuredProjects[i % featuredProjects.length].tint;
            return (
              <g key={i} transform={`translate(${station.x} ${station.y})`}>
                <ellipse cx="9" cy="33" rx="15" ry="5" fill={deep} />
                <rect width="18" height="32" rx="4" fill="#0c0f14" />
                <rect x="2" y="2" width="14" height="28" rx="2.5" fill={light} />
              </g>
            );
          })}

          {coins.map((coin, i) => (
            <circle key={i} cx={coin.x} cy={coin.y} r="3.2" fill="#ffc83d" />
          ))}

          <g className="promo-car" style={{ offsetPath: `path("${ROAD}")` }}>
            <rect x="-13" y="-7.5" width="26" height="15" rx="4" fill="var(--accent)" />
            <rect x="-6" y="-5.5" width="10" height="11" rx="2.5" fill="#9fd8ff" />
            <rect x="11" y="-6" width="2.5" height="3.5" rx="1" fill="#fff3c4" />
            <rect x="11" y="2.5" width="2.5" height="3.5" rx="1" fill="#fff3c4" />
          </g>
        </svg>
      </div>
    </aside>
  );
}
