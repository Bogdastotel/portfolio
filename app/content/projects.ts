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
  /**
   * The hard part and how you solved it: the section reviewers read most.
   * Two or three sentences each; the case study hides it while unset.
   */
  story?: { challenge: string; approach: string };
  contributions: string[];
  outcomes: { value: string; label: string }[];
  stack: string[];
  links: { label: string; href: string }[];
  /** Paths under /images/projects/<slug>/; a styled placeholder shows while empty. */
  screenshots: { src: string; alt: string }[];
  /** A wide image for the case study header, for projects (such as web apps) without phone screenshots. */
  cover?: { src: string; alt: string };
  /** A logo or brand image for the screen in the 3D world, used when there is no screenshot. */
  logo?: string;
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
    story: {
      challenge:
        "Action Network was a mature app on a legacy React Native CLI setup, and it had to move to Expo and React Native's New Architecture while 10M+ people a month kept using it. It also needed consent management and analytics that respect each user's choice, in a product where a slow screen or a wrong number is noticed straight away.",
      approach:
        "I was in charge of embedding OneTrust consent and the analytics that depend on it, and of the rewrite from React Native CLI to Expo on the New Architecture. Alongside that I measured the app and worked through performance improvements using Callstack's React Native optimization guide. When a mission-critical incident needed a cross-team effort, I took ownership of the mobile side, worked with the Paid Media engineering team and shipped the fixes that stabilised the apps.",
    },
    contributions: [
      "Rewrite from legacy React Native CLI to Expo with the New Architecture",
      "OneTrust consent management, embedded in the app",
      "Analytics integration tied to user consent",
      "Performance tracking and improvements, following Callstack's optimization guide",
      "Ownership of the mobile side during a mission-critical, cross-team incident",
      "Features across real-time odds, live scores, expert picks, bet tracking and line-movement alerts",
    ],
    outcomes: [{ value: "10M+", label: "monthly users" }],
    stack: ["React Native", "Expo", "TypeScript", "OneTrust", "iOS", "Android"],
    links: [
      {
        label: "Recommendation on LinkedIn",
        href: "https://www.linkedin.com/in/nikola-bogdanovic-082752177/details/recommendations/",
      },
    ],
    screenshots: [
      {
        src: "/images/projects/action-network/performance.jpg",
        alt: "Action Network bet tracking: all-time and last-30-day units won, ROI, record and a live win-probability card",
      },
    ],
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
    summary: "Car meetup and event app: find events, see the details and get tickets.",
    overview:
      "DeepDays brings car enthusiasts to meetups and events: each event has its date, location, description and tickets in one place. In the app the car is the profile, and an event is something you apply to with that car. As tech lead I owned the architecture of the mobile app and its backend, and built features across both while leading the team that shipped it.",
    story: {
      challenge:
        "DeepDays already had accounts and events on the web. The app had to put the car at the centre of that: photos and specs, a 3D model on the home screen, an application to take that car to an event, then tickets, a pass, and a QR sticker that opens the right car when someone scans it. Sign-in, share links and sticker scans all land in the same app, including when it is closed and when the link is opened inside a browser that never hands off a universal link. The garage, the application and the ticket describe the same car, so a wrong link or a half-filled profile is obvious straight away.",
      approach:
        "I owned the architecture of the Expo app and the API behind it, and shipped the car, application and ticket flows with a team of four. Sign-in links a phone number to an existing DeepDays account, with email magic links through my.deepdays.de and Apple sign-in beside it. Cold-start links are resolved before the main navigator mounts, and a custom deepdays:// scheme covers in-app browsers where the https link does not open the app. Adding a car sends the photos to a suggest endpoint, so model, modifications and horsepower come back filled in and the owner corrects whatever was off. The 3D car runs as a model-viewer scene in a WebView; on the home screen the page keeps the scroll and turns the model itself. Tickets are paid with Stripe, including Apple Pay and Google Pay, and the same ticket is added to Apple Wallet or Google Wallet. Alongside the features I kept the architecture calls, the reviews and the AI-assisted workflow for API scaffolding and refactors.",
    },
    contributions: [
      "Architecture and feature development for the React Native (Expo) app",
      "REST API design and development with NestJS and Express.js",
      "Architecture decisions, code reviews and mentoring for a team of 4",
      "AI-assisted workflows for API scaffolding, test generation and refactors",
    ],
    outcomes: [{ value: "4", label: "developers led" }],
    stack: ["React Native", "Expo", "NestJS", "Express.js", "MongoDB", "Supabase"],
    links: [],
    screenshots: [
      {
        src: "/images/projects/deepdays/event.jpg",
        alt: "DeepDays event screen for a car meetup in Italy, with date, location, description and tickets",
      },
    ],
    featured: true,
    tint: ["#e2553d", "#3d120b"],
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
    story: {
      challenge:
        "Svenska Fans was a legacy app built on a GraphQL API, and it had to move to a JSON:API backend on a short deadline. The new API renamed some fields, while the app's own variable names had to stay as they were. Ads had to follow the regulations that apply to them, and consent and push notifications had to work across the whole app. SoccerNews.nl and Goal.pl share one sports news template, so a feature added for one brand must not break the other.",
      approach:
        "I replaced the GraphQL layer with JSON:API and React Query, and put a mapper between the API and the app that translates the new field names back to the ones the screens already use, so the screens did not have to change. I wrote the ad scripts each regulation calls for, and set up OneSignal and OneTrust in both their dashboards and the app. On the backend I helped with the Laravel API. I architected and built the news template from scratch on React Native CLI, including the comment, vote and reply sections, and later rewrote it in Expo on the New Architecture. It is structured so brand-specific features can be added without touching what the other brand relies on. I also embedded ads there and used an in-house library to show videos as reels.",
    },
    contributions: [
      "Performance work that cut Svenska Fans load time by 37%",
      "Migration of the legacy app from GraphQL to JSON:API with React Query, behind a field-name mapper",
      "Regulation-specific ad scripts, plus OneSignal and OneTrust in the dashboards and the app",
      "Laravel backend support",
      "SoccerNews.nl and Goal.pl: a multi-brand news template architected and built from scratch on React Native CLI, later rewritten in Expo on the New Architecture",
      "Comment, vote and reply sections for the news apps",
      "Ads and reels-style video in the news apps, using an in-house video library",
    ],
    outcomes: [
      { value: "37%", label: "faster load time" },
      { value: "3", label: "apps across three markets" },
    ],
    stack: ["React Native", "Expo", "TypeScript", "React Query", "JSON:API", "OneSignal", "OneTrust", "Laravel"],
    links: [
      { label: "Svenska Fans · App Store", href: "https://apps.apple.com/app/id427561174" },
      { label: "SoccerNews.nl · App Store", href: "https://apps.apple.com/app/id1316409415" },
      { label: "Goal.pl · App Store", href: "https://apps.apple.com/app/id6670400959" },
    ],
    screenshots: [
      {
        src: "/images/projects/svenska-fans/news-feed.jpg",
        alt: "Svenska Fans news feed: football headlines, a live broadcast banner and tabs for hottest articles and forum threads",
      },
      {
        src: "/images/projects/svenska-fans/soccernews-teams.jpg",
        alt: "SoccerNews.nl team picker: follow clubs like Ajax, PSV and Feyenoord to personalise the news feed",
      },
      {
        src: "/images/projects/svenska-fans/goal-comments.jpg",
        alt: "Goal.pl article comments: readers discuss a football story, with upvotes and replies",
      },
    ],
    status: "Live",
    featured: true,
    tint: ["#f2b632", "#3f2c05"],
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
      "VI Appen gives couples and parents knowledge and guidance for everyday life, with a couple guide and a parent guide. It is live on the App Store and Google Play in Norway only. I worked across the mobile app, the web app and the backend.",
    story: {
      challenge:
        "VI Appen was first written in a functional style, with pipe syntax throughout, so working in it meant learning that way of writing code: Ramda, ts-belt and fp-ts, and languages such as Fable and ReScript. I also looked after the AWS setup, the Lambda functions and the NestJS backend. Then the app was hit by an SMS fraud attack: a script kept creating new accounts with a premium-rate phone number, so every sign-up made our AWS side send a two-factor SMS to it, and the attacker took a share of what the provider was paid for each message received.",
      approach:
        "I traced the traffic back to the sign-up and two-factor flow and worked out what the script was doing. I then put stricter rules on the Lambda functions and added throttling to the high-risk endpoints, both on the AWS Lambdas and in the NestJS API, so a single caller could no longer trigger a stream of SMS codes.",
    },
    contributions: [
      "Mobile app in React Native (CLI)",
      "Web app in React",
      "Backend API in NestJS",
      "AWS and Lambda management",
      "Stopped an SMS fraud attack on sign-up with stricter Lambda rules and throttling on high-risk endpoints",
      "Functional-style codebase: pipe syntax with Ramda, ts-belt and fp-ts",
    ],
    outcomes: [],
    stack: ["React Native", "React", "NestJS", "TypeScript", "AWS Lambda", "fp-ts", "Ramda"],
    // Store listings are Norway-only and show as missing elsewhere, so no store links.
    links: [],
    screenshots: [
      {
        src: "/images/projects/vi-appen/home.jpg",
        alt: "VI Appen home screen: a morning greeting and a couple guide lesson from a psychologist, with a video as the next step",
      },
    ],
    status: "Live",
    featured: true,
    tint: ["#2f9e8f", "#0d2f2b"],
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
    story: {
      challenge:
        "Scoops was written from scratch, and the architecture of the whole product was mine to decide. The hard part was purchasing: every chef has their own paid subscription, so one person can hold several at once, and what they have paid for has to stay correct and usable offline and in places with no network at all.",
      approach:
        "I architected the Expo app, the Express.js API and the admin dashboard on Firebase and Google Cloud, and built all of the purchasing on RevenueCat, so that access is decided per chef and still holds when the device is offline. I wrote custom scripts so that the purchase grouping for a new chef can be added from the admin dashboard. The iOS app runs at a 99.95% crash-free rate.",
    },
    contributions: [
      "Architecture of the whole product, built from scratch",
      "Expo app with recipes, chefs, collections, search, favourites and a shopping list",
      "Offline access to saved data on the device, including what each subscription unlocks",
      "Per-chef in-app subscriptions, built entirely on RevenueCat",
      "Custom scripts that let a new chef's purchase grouping be added from the admin dashboard",
      "Express.js API with Drizzle ORM on Postgres",
      "Automatic translation of recipes, ingredients and steps with the Claude API",
      "Admin dashboard for recipes, chefs, ingredients and blog posts",
      "Next.js site with links that open a recipe in the app",
    ],
    outcomes: [{ value: "99.95%", label: "crash-free on iOS" }],
    stack: [
      "React Native",
      "Expo",
      "TypeScript",
      "Express.js",
      "Firebase",
      "Google Cloud",
      "PostgreSQL",
      "RevenueCat",
      "Next.js",
    ],
    links: [
      { label: "App Store", href: "https://apps.apple.com/us/app/scoops/id6760790355" },
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.knguru.scoops.app" },
    ],
    screenshots: [
      {
        src: "/images/projects/scoops/explore-chefs.jpg",
        alt: "Scoops Explore chefs screen: chef cards with a Subscribe button and their latest recipes, rating and cooking time",
      },
    ],
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
      "Architecture and stack set up from zero",
      "One Expo codebase shipping to iOS, Android and the web",
      "NestJS API on Postgres, with Redis job queues for video and audio processing",
      "Resumable video uploads that survive a dropped connection",
      "CV upload with automatic extraction of structured profile data using an LLM",
      "Employer subscriptions with Stripe",
      "English and German throughout, with Google and Apple sign-in",
      "Admin dashboard in React with Vite",
      "Supabase for the data layer, with deploys on Railway",
    ],
    outcomes: [],
    stack: [
      "React Native",
      "Expo",
      "TypeScript",
      "NestJS",
      "PostgreSQL",
      "Supabase",
      "Redis",
      "Stripe",
      "Railway",
      "Vite",
    ],
    // REVIEW: add store links after release.
    links: [],
    screenshots: [
      {
        src: "/images/projects/brava/job-feed.jpg",
        alt: "Brava job feed: a full-screen video job post for a barista in Amsterdam with an Apply button",
      },
    ],
    status: "Production-ready",
    featured: true,
    tint: ["#7c5cff", "#1c1147"],
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
    screenshots: [
      {
        src: "/images/projects/dark-stories/saved-stories.jpg",
        alt: "Dark Stories story cards, with the option to save the stories you love.",
      },
    ],
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
    screenshots: [
      {
        src: "/images/projects/bedtime-stories/player.jpg",
        alt: "Bedtime Stories audio player with the up-next queue.",
      },
    ],
    status: "Production-ready",
    tint: ["#4f6bd8", "#0e1740"],
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
    screenshots: [
      {
        src: "/images/projects/ms-fitness/exercise.jpg",
        alt: "MS Fitness exercise screen for the deadlift, with muscle diagram, sets and a video tutorial.",
      },
    ],
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
    screenshots: [
      {
        src: "/images/projects/troskovi/bill-overview.jpg",
        alt: "Troskovi bill overview: current balance, payment efficiency and monthly charges.",
      },
    ],
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
    screenshots: [
      {
        src: "/images/projects/and-repeat/onboarding.jpg",
        alt: "&Repeat onboarding screen: earn, redeem, enjoy and repeat.",
      },
    ],
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
    cover: {
      src: "/images/projects/brame/cover.jpg",
      alt: "Brame illustration: a branded game card surrounded by reward and settings widgets.",
    },
    logo: "/images/projects/brame/logo.png",
    status: "Live",
    tint: ["#f25fa0", "#3d0f27"],
  },
  {
    slug: "clubkit",
    name: "ClubKit",
    company: "Knguru Studios",
    role: "Tech Lead, Full Stack Developer",
    period: "2025 – 2026",
    platforms: "iOS · Android · Web · API",
    summary: "Nightclub events app: browse parties, see the details and buy tickets.",
    overview:
      "ClubKit is an events app for nightclubs: guests browse upcoming parties, read the event details and buy tickets. It spans a mobile app, a companion web platform and the API behind both, and my work was scaling it across the full stack.",
    contributions: [
      "Full-stack scaling across the mobile app, web platform and API",
      "Cross-platform mobile development with React Native and Expo",
      "Companion web platform with React and Next.js",
      "REST APIs with Express.js and NestJS on Supabase and MongoDB",
    ],
    outcomes: [],
    stack: ["React Native", "Expo", "React", "Next.js", "NestJS", "Express.js", "MongoDB"],
    links: [],
    screenshots: [
      {
        src: "/images/projects/clubkit/event.jpg",
        alt: "ClubKit event screen for a DJ party at a club, with date, event details and a Buy ticket button",
      },
    ],
    tint: ["#5b7cfa", "#131c45"],
  },
];

export function getProject(slug: string | undefined) {
  return projects.find((project) => project.slug === slug);
}

export const featuredProjects = projects.filter((project) => project.featured);
export const moreProjects = projects.filter((project) => !project.featured);
