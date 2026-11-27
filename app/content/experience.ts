export type Job = {
  company: string;
  title: string;
  place: string;
  period: string;
  points: string[];
  /** Smaller client projects worth naming without a full case study. */
  apps?: { name: string; note: string; /** Links the chip to /work/<slug>. */ slug?: string }[];
};

export const experience: Job[] = [
  {
    company: "Knguru Studios",
    title: "Tech Lead, Full Stack Developer",
    place: "Leipzig, Germany",
    period: "06/2025 – 10/2026",
    points: [
      "Led a team of 4 developers: architecture decisions, code reviews, mentoring and enforcing best practices.",
      "Directed architecture and development of cross-platform mobile apps with React Native and Expo, plus companion web platforms (React, Next.js), REST APIs (Express.js, NestJS) and Supabase/MongoDB databases.",
      "Introduced AI-assisted development (Claude Code, Cursor) across the team, with agent workflows for API scaffolding, test generation and refactors.",
    ],
    apps: [
      { name: "DeepDays", note: "app and backend, architecture to release", slug: "deepdays" },
      { name: "Scoops", note: "chef recipes", slug: "scoops" },
      { name: "Brava", note: "video job matching", slug: "brava" },
      { name: "ClubKit", note: "mobile app, web platform and API", slug: "clubkit" },
      { name: "Dark Stories", note: "mystery riddle game", slug: "dark-stories" },
      { name: "Bedtime Stories", note: "audio stories for children", slug: "bedtime-stories" },
    ],
  },
  {
    company: "Better Collective",
    title: "Senior Software Developer · React Native Developer",
    place: "Niš, Serbia",
    period: "08/2023 – 11/2026",
    points: [
      "Developed features for Action Network (10M+ monthly users): real-time odds, live scores, expert picks, bet tracking across sportsbooks and line-movement alerts.",
      "Cut load time on Svenska Fans, a multi-sport app for the Swedish market, by 37%.",
      "Built sports news apps for the Dutch and Polish markets (SoccerNews.nl, Goal.pl).",
    ],
  },
  {
    company: "Codeus",
    title: "Full-Stack Developer",
    place: "Niš, Serbia",
    period: "06/2021 – 08/2023",
    points: [
      "Built React Native apps for clients across industries, with React, Angular, Node.js and Symfony on web and backend.",
    ],
    apps: [
      { name: "VI Appen", note: "parenting guidance", slug: "vi-appen" },
      { name: "MS Fitness", note: "training and diet coaching", slug: "ms-fitness" },
      { name: "Troskovi", note: "building expenses", slug: "troskovi" },
      { name: "&Repeat", note: "QR-based recycling rewards", slug: "and-repeat" },
    ],
  },
  {
    company: "Brame (Branded Game)",
    title: "Frontend Web Developer",
    place: "Serbia",
    period: "12/2019 – 06/2021",
    points: [
      "Built the web dashboard, gaming logic and admin game builder for the Brame.io gamification marketing platform using Redux.js, TypeScript, Angular, React and Node.js.",
    ],
  },
  {
    company: "Softelm",
    title: "Frontend Web Developer",
    place: "Serbia",
    period: "10/2018 – 11/2019",
    points: ["Frontend web application development using React.js and GitHub workflows."],
  },
];
