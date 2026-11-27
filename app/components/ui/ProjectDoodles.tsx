import type { CSSProperties, ReactNode } from "react";

type Side = "left" | "right";

type Doodle = {
  /** Distance from the card's left or right edge, as a percentage. */
  x: number;
  /** Distance from the top of the hero area, as a percentage. */
  y: number;
  side: Side;
  /** Resting rotation once popped out, in degrees. */
  rotate: number;
  /** Rendered size in px. */
  size?: number;
  svg: ReactNode;
};

/* Shared stroke props so every doodle matches the line style of the play promo. */
const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
const accent = { ...line, stroke: "var(--tint)" } as const;

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" overflow="visible">
      {children}
    </svg>
  );
}

const doodles: Record<string, Doodle[]> = {
  "action-network": [
    {
      side: "left",
      x: 8,
      y: 14,
      rotate: -10,
      size: 56,
      svg: (
        <Svg>
          <rect x="2" y="12" width="44" height="24" rx="12" {...line} />
          <text
            x="24"
            y="29"
            textAnchor="middle"
            fill="var(--tint)"
            fontSize="14"
            fontWeight="700"
            fontFamily="var(--font-mono)"
          >
            +150
          </text>
        </Svg>
      ),
    },
    {
      side: "left",
      x: 14,
      y: 56,
      rotate: 6,
      svg: (
        <Svg>
          <path d="M6 6v36h36" {...line} />
          <path className="doodle-draw" pathLength={1} d="M10 34l9-10 7 6 14-16" {...accent} />
          <path d="M34 14h6v6" {...accent} />
        </Svg>
      ),
    },
    {
      side: "right",
      x: 12,
      y: 16,
      rotate: 12,
      svg: (
        <Svg>
          <g className="doodle-wiggle">
            <path d="M14 34V22a10 10 0 0 1 20 0v12l4 4H10z" {...line} />
            <path d="M20 42a4 4 0 0 0 8 0" {...line} />
          </g>
          <circle cx="36" cy="12" r="4" fill="var(--tint)" className="doodle-pulse" />
        </Svg>
      ),
    },
    {
      side: "right",
      x: 8,
      y: 58,
      rotate: -8,
      svg: (
        <Svg>
          <path d="M16 38V10M8 18l8-8 8 8" {...accent} />
          <path d="M32 10v28M24 30l8 8 8-8" {...line} />
        </Svg>
      ),
    },
  ],
  brava: [
    {
      side: "left",
      x: 10,
      y: 14,
      rotate: -12,
      svg: (
        <Svg>
          <rect x="6" y="4" width="36" height="40" rx="6" {...line} />
          <path d="M20 16v16l12-8z" {...accent} fill="var(--tint)" />
        </Svg>
      ),
    },
    {
      side: "left",
      x: 14,
      y: 58,
      rotate: 8,
      svg: (
        <Svg>
          <rect x="8" y="6" width="28" height="36" rx="5" {...line} transform="rotate(-12 22 24)" />
          <path
            className="doodle-pulse"
            d="M30 40s-10-6-10-12a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 6-10 12-10 12z"
            {...accent}
            fill="var(--tint)"
          />
        </Svg>
      ),
    },
    {
      side: "right",
      x: 12,
      y: 14,
      rotate: 10,
      size: 32,
      svg: (
        <Svg>
          <circle cx="24" cy="24" r="18" {...line} />
          <circle className="doodle-pulse" cx="24" cy="24" r="10" fill="var(--tint)" />
        </Svg>
      ),
    },
    {
      side: "right",
      x: 8,
      y: 54,
      rotate: -10,
      svg: (
        <Svg>
          <rect x="4" y="14" width="28" height="22" rx="4" {...line} />
          <path d="M32 22l12-6v18l-12-6" {...accent} />
        </Svg>
      ),
    },
  ],
  scoops: [
    {
      side: "left",
      x: 8,
      y: 16,
      rotate: -18,
      size: 52,
      svg: (
        <Svg>
          <g className="doodle-tilt">
            <path d="M6 42l15-15" {...line} strokeWidth={4} />
            <circle cx="30" cy="16" r="9" fill="var(--tint)" />
            <path d="M18 18a12 12 0 0 0 22 8" {...line} />
          </g>
        </Svg>
      ),
    },
    {
      side: "left",
      x: 16,
      y: 60,
      rotate: 8,
      svg: (
        <Svg>
          <path d="M14 30a9 9 0 0 1-2-17 10 10 0 0 1 24 0 9 9 0 0 1-2 17z" {...line} />
          <path d="M14 30v10h20V30" {...line} />
          <path d="M14 35h20" {...accent} />
        </Svg>
      ),
    },
    {
      side: "right",
      x: 12,
      y: 12,
      rotate: 16,
      svg: (
        <Svg>
          <g className="doodle-wiggle">
            <path d="M24 26v18" {...line} strokeWidth={3} />
            <path d="M24 26c-10-4-10-22 0-22s10 18 0 22z" {...accent} />
            <path d="M24 26c-4-4-4-18 0-22M24 26c4-4 4-18 0-22" {...accent} />
          </g>
        </Svg>
      ),
    },
    {
      side: "right",
      x: 10,
      y: 60,
      rotate: -10,
      size: 32,
      svg: (
        <Svg>
          <path
            className="doodle-pulse"
            d="M24 42S6 31 6 18a9 9 0 0 1 18-2 9 9 0 0 1 18 2c0 13-18 24-18 24z"
            {...accent}
            fill="var(--tint)"
          />
        </Svg>
      ),
    },
  ],
  deepdays: [
    {
      side: "left",
      x: 4,
      y: 58,
      rotate: 0,
      size: 60,
      svg: (
        <Svg>
          <g className="doodle-drive">
            <path d="M4 32v-6l6-2 6-8h14l8 8 6 2v6z" {...line} />
            <path d="M18 16v8M10 24h28" {...line} />
            <circle cx="13" cy="33" r="4" {...accent} fill="var(--surface)" />
            <circle cx="35" cy="33" r="4" {...accent} fill="var(--surface)" />
          </g>
          <path d="M0 42h48" {...line} strokeDasharray="4 5" className="doodle-road" />
        </Svg>
      ),
    },
    {
      side: "left",
      x: 12,
      y: 12,
      rotate: -8,
      svg: (
        <Svg>
          <path d="M10 44V6" {...line} />
          <g className="doodle-wave">
            <path d="M10 8h28v20H10z" {...line} />
            <path
              d="M10 8h7v5h-7zM24 8h7v5h-7zM17 13h7v5h-7zM31 13h7v5h-7zM10 18h7v5h-7zM24 18h7v5h-7zM17 23h7v5h-7zM31 23h7v5h-7z"
              fill="var(--tint)"
            />
          </g>
        </Svg>
      ),
    },
    {
      side: "right",
      x: 10,
      y: 12,
      rotate: 10,
      svg: (
        <Svg>
          <rect x="6" y="10" width="36" height="32" rx="5" {...line} />
          <path d="M6 20h36M16 6v8M32 6v8" {...line} />
          <path className="doodle-pulse" d="M24 38s-7-6-7-10a7 7 0 0 1 14 0c0 4-7 10-7 10z" fill="var(--tint)" />
        </Svg>
      ),
    },
    {
      side: "right",
      x: 14,
      y: 60,
      rotate: -6,
      size: 36,
      svg: (
        <Svg>
          <path d="M8 42h32M14 42L22 6h4l8 36" {...line} />
          <path d="M18 24h12M16 33h16" {...accent} strokeWidth={4} />
        </Svg>
      ),
    },
  ],
  clubkit: [
    {
      side: "left",
      x: 10,
      y: 14,
      rotate: -10,
      svg: (
        <Svg>
          <path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10z" {...line} />
          <path className="doodle-pulse" d="M24 14l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L15 21l6-1z" fill="var(--tint)" />
        </Svg>
      ),
    },
    {
      side: "left",
      x: 14,
      y: 60,
      rotate: 10,
      svg: (
        <Svg>
          <g className="doodle-wiggle">
            <circle cx="18" cy="28" r="12" {...line} />
            <path d="M24 18l18-8v8l-12 6" {...line} />
            <circle cx="18" cy="28" r="4" fill="var(--tint)" />
          </g>
        </Svg>
      ),
    },
    {
      side: "right",
      x: 12,
      y: 12,
      rotate: 12,
      svg: (
        <Svg>
          <path d="M16 6l-12 8 5 8 5-3v23h20V19l5 3 5-8-12-8c-1 4-4 6-8 6s-7-2-8-6z" {...line} />
          <text
            x="24"
            y="34"
            textAnchor="middle"
            fill="var(--tint)"
            fontSize="13"
            fontWeight="700"
            fontFamily="var(--font-mono)"
          >
            10
          </text>
        </Svg>
      ),
    },
    {
      side: "right",
      x: 8,
      y: 58,
      rotate: -8,
      svg: (
        <Svg>
          <rect x="6" y="10" width="36" height="32" rx="5" {...line} />
          <path d="M6 20h36M16 6v8M32 6v8" {...line} />
          <path className="doodle-draw" pathLength={1} d="M16 30l6 6 11-11" {...accent} strokeWidth={3} />
        </Svg>
      ),
    },
  ],
  "svenska-fans": [
    {
      side: "left",
      x: 6,
      y: 14,
      rotate: -8,
      size: 64,
      svg: (
        <Svg>
          <g className="doodle-draw-all">
            <rect pathLength={1} x="2" y="8" width="44" height="32" rx="2" {...line} />
            <path pathLength={1} d="M24 8v32" {...line} />
            <circle pathLength={1} cx="24" cy="24" r="6" {...line} />
            <path pathLength={1} d="M2 16h7v16H2M46 16h-7v16h7" {...accent} />
          </g>
        </Svg>
      ),
    },
    {
      side: "left",
      x: 16,
      y: 64,
      rotate: 0,
      size: 36,
      svg: (
        <Svg>
          <g className="doodle-spin">
            <circle cx="24" cy="24" r="20" {...line} />
            <path d="M24 15l8 6-3 9h-10l-3-9z" fill="var(--tint)" />
            <path d="M24 15V5M32 21l9-3M29 30l6 8M19 30l-6 8M16 21l-9-3" {...line} />
          </g>
        </Svg>
      ),
    },
    {
      side: "right",
      x: 10,
      y: 12,
      rotate: 10,
      size: 52,
      svg: (
        <Svg>
          <circle cx="24" cy="27" r="17" {...line} />
          <path d="M20 4h8M24 4v6" {...line} />
          <path className="doodle-tick" d="M24 27V16" {...accent} strokeWidth={3} />
          <text
            x="24"
            y="38"
            textAnchor="middle"
            fill="var(--tint)"
            fontSize="8"
            fontWeight="700"
            fontFamily="var(--font-mono)"
          >
            −37%
          </text>
        </Svg>
      ),
    },
    {
      side: "right",
      x: 10,
      y: 60,
      rotate: -6,
      svg: (
        <Svg>
          <path d="M4 40V10h40v30" {...line} />
          <path
            d="M12 10v30M20 10v30M28 10v30M36 10v30M4 18h40M4 26h40M4 34h40"
            {...line}
            strokeWidth={1}
            opacity={0.5}
          />
          <circle className="doodle-pulse" cx="30" cy="30" r="5" fill="var(--tint)" />
        </Svg>
      ),
    },
  ],
};

type Props = { slug: string; tint: [string, string] };

/** Small themed line drawings that pop out beside a project's phone on hover. */
export function ProjectDoodles({ slug, tint }: Props) {
  const set = doodles[slug];
  if (!set) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 text-fg/80"
      style={{ "--tint": tint[0] } as CSSProperties}
    >
      {set.map((doodle, i) => {
        const size = doodle.size ?? 40;
        return (
          <span
            key={i}
            className="doodle"
            style={
              {
                top: `${doodle.y}%`,
                [doodle.side]: `${doodle.x}%`,
                width: size,
                height: size,
                "--i": i,
                "--r": `${doodle.rotate}deg`,
                "--dx": doodle.side === "left" ? "40px" : "-40px",
              } as CSSProperties
            }
          >
            {doodle.svg}
          </span>
        );
      })}
    </div>
  );
}
