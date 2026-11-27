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
  /** Shown as a badge; leave out when the release state is not confirmed. */
  status?: ProjectStatus;
  /** Large card on the home page; the rest go in the compact "More work" list. */
  featured?: boolean;
};

export type ProjectStatus = "Live" | "Production-ready";

// Array order is the order on the home page and in the "Next project" chain.
// Copy is limited to what the CV, the code and the public store listings say.
// Lines marked REVIEW are assumptions to confirm. Screenshots are still missing.
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
    featured: true,
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
    featured: true,
    tint: ["#e2553d", "#3d120b"],
  },
  {
    slug: "scoops",
    name: "Scoops",
    company: "Knguru Studios",
    role: "Tech Lead",
    period: "2025 – 2026",
    platforms: "iOS · Android · Web · API",
    summary: "Recipe app built around chefs, with paid subscriptions to each chef.",
    overview:
      "Scoops is a recipe app where people follow chefs and subscribe to their recipes. It is live on the App Store and Google Play in English and German. I led the mobile app, the API, the admin dashboard and the web pages that open recipes in the app.",
    contributions: [
      "Expo app with recipes, chefs, collections, search, favourites and a shopping list",
      "Offline access to saved data on the device",
      "Per-chef in-app subscriptions with RevenueCat",
      "Express.js API with Drizzle ORM on Postgres",
      "Automatic translation of recipes, ingredients and steps with the Claude API",
      "Admin dashboard for recipes, chefs, ingredients and blog posts",
      "Next.js site with links that open a recipe in the app",
    ],
    outcomes: [],
    stack: ["React Native", "Expo", "TypeScript", "Express.js", "PostgreSQL", "Supabase", "RevenueCat", "Next.js"],
    links: [
      { label: "App Store", href: "https://apps.apple.com/us/app/scoops/id6760790355" },
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.knguru.scoops.app" },
    ],
    screenshots: [],
    status: "Live",
    featured: true,
    tint: ["#ff7a59", "#45160a"],
  },
  {
    slug: "brava",
    name: "Brava",
    company: "Knguru Studios",
    role: "Tech Lead",
    period: "2026",
    platforms: "iOS · Android · Web · API",
    summary: "Video-first job matching: swipe through jobs, apply with a video answer.",
    overview:
      "Brava matches job seekers and employers through short video. Job seekers swipe a feed of jobs and apply with a CV, text, voice or video answer; employers post jobs, review applicants and manage their company content. I led the build of the app, the API behind it and the admin dashboard.",
    contributions: [
      "One Expo codebase shipping to iOS, Android and the web",
      "NestJS API on Postgres, with Redis job queues for video and audio processing",
      "Resumable video uploads that survive a dropped connection",
      "CV upload with automatic extraction of structured profile data using an LLM",
      "Employer subscriptions with Stripe",
      "English and German throughout, with Google and Apple sign-in",
      "Admin dashboard in React",
    ],
    outcomes: [],
    stack: ["React Native", "Expo", "TypeScript", "NestJS", "PostgreSQL", "Supabase", "Redis", "Stripe"],
    // REVIEW: add store links after release.
    links: [],
    screenshots: [],
    status: "Production-ready",
    featured: true,
    tint: ["#7c5cff", "#1c1147"],
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
    featured: true,
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
    featured: true,
    tint: ["#f2b632", "#3f2c05"],
  },
  {
    slug: "dark-stories",
    name: "Dark Stories",
    company: "Knguru Studios",
    role: "Tech Lead",
    // REVIEW: period assumed.
    period: "2025 – 2026",
    // REVIEW: only the App Store listing was confirmed.
    platforms: "iOS",
    summary: "Mystery riddle game (Blackstories): ask the right questions to uncover what happened.",
    overview:
      "Dark Stories is a riddle game in the black stories format. Each card describes a puzzling scene, and players work out the full story by asking questions. It is live on the App Store.",
    // REVIEW: taken from the store listing only. Replace with what you built.
    contributions: [
      "Riddle cards with a hidden solution to uncover",
      "Free to play, with in-app purchases",
      "iPhone and iPad release on the App Store",
    ],
    outcomes: [],
    // REVIEW: assumed from the other Knguru apps.
    stack: ["React Native", "Expo"],
    links: [{ label: "App Store", href: "https://apps.apple.com/app/id6754256101" }],
    screenshots: [],
    status: "Live",
    tint: ["#b3261e", "#1a0504"],
  },
  {
    slug: "bedtime-stories",
    name: "Bedtime Stories",
    company: "Knguru Studios",
    role: "Tech Lead",
    // REVIEW: period assumed.
    period: "2025",
    platforms: "iOS · Android",
    summary: "Audio bedtime stories for children, with a subscription.",
    overview:
      "Bedtime Stories streams narrated bedtime stories for children. Parents can queue stories, save favourites and pick up where they left off. The app is built and ready for release.",
    contributions: [
      "Audio player with background playback, a queue and a mini-player",
      "Favourites, narrators, ratings, search and listening progress",
      "Subscriptions with RevenueCat, including iOS offer codes",
      "Email one-time-code, Google and Apple sign-in",
      "English and German",
    ],
    outcomes: [],
    stack: ["React Native", "Expo", "TypeScript", "Supabase", "RevenueCat"],
    // REVIEW: add store links after release.
    links: [],
    screenshots: [],
    status: "Production-ready",
    tint: ["#4f6bd8", "#0e1740"],
  },
  {
    slug: "vi-appen",
    name: "VI Appen",
    company: "Codeus",
    role: "Full-Stack Developer",
    // REVIEW: shown as the whole Codeus period.
    period: "2021 – 2023",
    platforms: "iOS · Android · Web · API",
    summary: "Norwegian guidance app for couples and parents, on mobile and web.",
    overview:
      "VI Appen gives couples and parents knowledge and guidance for everyday life, with a couple guide and a parent guide. I worked across the mobile app, the web app and the backend.",
    contributions: ["Mobile app in React Native (CLI)", "Web app in React", "Backend API in NestJS"],
    outcomes: [],
    stack: ["React Native", "React", "NestJS", "TypeScript"],
    // REVIEW: the Google Play listing (no.viappen.viappen) returned 404, so this links to Aptoide and has no status.
    links: [{ label: "Aptoide", href: "https://vi-appen.en.aptoide.com/app" }],
    screenshots: [],
    tint: ["#e0528a", "#3f0f24"],
  },
  {
    slug: "ms-fitness",
    name: "MS Fitness",
    company: "Codeus",
    role: "Full-Stack Developer",
    // REVIEW: shown as the whole Codeus period.
    period: "2021 – 2023",
    platforms: "iOS · Android",
    summary: "Coaching app for training and nutrition.",
    overview:
      "MS Fitness is a fitness coaching app covering both training and diet. It gives users meal and recipe choices and works out calories and macronutrients for them. The app is React Native on the front end with a Symfony backend.",
    contributions: [
      "Full mobile app in React Native",
      "Training and diet features for coaching clients",
      "Meal and recipe choices with automatic calorie and macronutrient calculation",
      "Integration with the Symfony backend",
    ],
    outcomes: [],
    stack: ["React Native", "Symfony"],
    links: [{ label: "App Store", href: "https://apps.apple.com/app/id1547960588" }],
    screenshots: [],
    status: "Live",
    tint: ["#12b5a6", "#063b36"],
  },
  {
    slug: "troskovi",
    name: "Troskovi",
    company: "Codeus",
    role: "Full-Stack Developer",
    // REVIEW: shown as the whole Codeus period.
    period: "2021 – 2023",
    platforms: "iOS · Android",
    summary: "Building expenses and resident-to-manager communication for housing communities.",
    overview:
      "Troskovi helps residential buildings manage shared expenses and keeps residents in touch with their building manager. Residents can follow costs and report problems with photos. It is built with React Native and Symfony.",
    contributions: [
      "Mobile app in React Native",
      "Expense tracking for residential buildings",
      "Problem reports with photos, sent to the building manager",
      "Integration with the Symfony backend",
    ],
    outcomes: [],
    stack: ["React Native", "Symfony"],
    links: [
      { label: "Website", href: "https://troskovi.com" },
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.troskovi" },
    ],
    screenshots: [],
    status: "Live",
    tint: ["#3f9bd6", "#0b2a40"],
  },
  {
    slug: "and-repeat",
    name: "&Repeat",
    company: "Codeus",
    role: "Full-Stack Developer",
    // REVIEW: shown as the whole Codeus period.
    period: "2021 – 2023",
    platforms: "iOS · Android",
    summary: "Recycling rewards: scan a QR code on packaging, earn credit at restaurants.",
    overview:
      "&Repeat encourages recycling of takeaway packaging. Users scan the QR code on the packaging when they return it and get rewarded at participating restaurants.",
    contributions: [
      "Mobile app in React Native",
      "QR code scanning for packaging",
      "Rewards to spend at participating restaurants",
    ],
    outcomes: [],
    stack: ["React Native"],
    // REVIEW: the App Store listing (id1551123480) returned 404, so no link and no status.
    links: [],
    screenshots: [],
    tint: ["#5fb04a", "#16300f"],
  },
  {
    slug: "brame",
    name: "Brame",
    company: "Brame",
    role: "Frontend Web Developer",
    period: "2019 – 2021",
    platforms: "Web",
    summary: "Gamification marketing platform: the dashboard, the games and the game builder.",
    overview:
      "Brame is a gamification platform that lets marketing teams build branded games for their campaigns. I built the dashboard that is the front end of the web app, developed game logic, and built the admin game builder.",
    contributions: [
      "Dashboard, the front end of the web app",
      "Game logic for the branded games",
      "Admin game builder",
    ],
    outcomes: [],
    stack: ["Angular", "React", "Redux", "TypeScript", "Node.js", "SASS"],
    links: [{ label: "Website", href: "https://www.brame.io/" }],
    screenshots: [],
    status: "Live",
    tint: ["#f25fa0", "#3d0f27"],
  },
];

export function getProject(slug: string | undefined) {
  return projects.find((project) => project.slug === slug);
}

export const featuredProjects = projects.filter((project) => project.featured);
export const moreProjects = projects.filter((project) => !project.featured);
