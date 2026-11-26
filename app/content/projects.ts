export type Project = {
  slug: string;
  name: string;
  company: string;
  role: string;
  period: string;
  platforms: string;
  /** One line for cards and meta descriptions. */
  summary: string;
  overview: string;
  contributions: string[];
  outcomes: { value: string; label: string }[];
  stack: string[];
  links: { label: string; href: string }[];
  /** Paths under /images/projects/<slug>/; a styled placeholder shows while empty. */
  screenshots: { src: string; alt: string }[];
  /** Two colours for the placeholder artwork. */
  tint: [string, string];
};

// Copy here is limited to what is on the CV. Review each entry, then add
// store links and screenshots.
export const projects: Project[] = [
  {
    slug: "action-network",
    name: "Action Network",
    company: "Better Collective",
    role: "Senior Software Developer",
    period: "2023 – 2026",
    platforms: "iOS · Android",
    summary: "Sports betting companion app used by 10M+ people a month.",
    overview:
      "Action Network gives sports bettors one place to follow odds, scores and their own bets. At 10M+ monthly users, every feature has to stay fast and correct while data changes by the second.",
    contributions: [
      "Real-time odds that update live across sportsbooks",
      "Live scores",
      "Expert picks",
      "Bet tracking across sportsbooks",
      "Line-movement alerts",
    ],
    outcomes: [{ value: "10M+", label: "monthly users" }],
    stack: ["React Native", "TypeScript", "iOS", "Android"],
    links: [],
    screenshots: [],
    tint: ["#0f9d58", "#063a22"],
  },
  {
    slug: "deepdays",
    name: "DeepDays",
    company: "Knguru Studios",
    role: "Tech Lead",
    period: "2025 – 2026",
    platforms: "iOS · Android · API",
    summary: "Cross-platform app and backend, led from architecture to release.",
    overview:
      "As tech lead I owned the architecture of the DeepDays mobile app and its backend, and built features across both while leading the team that shipped it.",
    contributions: [
      "Architecture and feature development for the React Native (Expo) app",
      "REST API design and development with NestJS and Express.js",
      "Architecture decisions, code reviews and mentoring for a team of 4",
      "AI-assisted workflows for API scaffolding, test generation and refactors",
    ],
    outcomes: [{ value: "4", label: "developers led" }],
    stack: ["React Native", "Expo", "NestJS", "Express.js", "MongoDB", "Supabase"],
    links: [],
    screenshots: [],
    tint: ["#e2553d", "#3d120b"],
  },
  {
    slug: "clubkit",
    name: "ClubKit",
    company: "Knguru Studios",
    role: "Tech Lead, Full Stack Developer",
    period: "2025 – 2026",
    platforms: "iOS · Android · Web · API",
    summary: "Full-stack scaling of a mobile app, its web platform and API.",
    overview:
      "ClubKit spans a mobile app, a companion web platform and the API behind both. My work was scaling it across the full stack.",
    contributions: [
      "Full-stack scaling across the mobile app, web platform and API",
      "Cross-platform mobile development with React Native and Expo",
      "Companion web platform with React and Next.js",
      "REST APIs with Express.js and NestJS on Supabase and MongoDB",
    ],
    outcomes: [],
    stack: ["React Native", "Expo", "React", "Next.js", "NestJS", "Express.js", "MongoDB"],
    links: [],
    screenshots: [],
    tint: ["#5b7cfa", "#131c45"],
  },
  {
    slug: "svenska-fans",
    name: "Svenska Fans + news apps",
    company: "Better Collective",
    role: "React Native Developer",
    period: "2023 – 2026",
    platforms: "iOS · Android",
    summary: "A 37% load-time cut, plus sports news apps for two more markets.",
    overview:
      "Svenska Fans is a multi-sport app for the Swedish market. I cut its load time by 37%, and built sports news apps for the Dutch and Polish markets: SoccerNews.nl and Goal.pl.",
    contributions: [
      "Performance work that cut Svenska Fans load time by 37%",
      "SoccerNews.nl, a sports news app for the Dutch market",
      "Goal.pl, a sports news app for the Polish market",
    ],
    outcomes: [
      { value: "37%", label: "faster load time" },
      { value: "3", label: "apps across three markets" },
    ],
    stack: ["React Native", "TypeScript", "iOS", "Android"],
    links: [],
    screenshots: [],
    tint: ["#f2b632", "#3f2c05"],
  },
];

export function getProject(slug: string | undefined) {
  return projects.find((project) => project.slug === slug);
}
