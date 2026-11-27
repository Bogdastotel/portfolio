export const profile = {
  name: "Nikola Bogdanovic",
  initials: "NB",
  roles: ["Full Stack Developer", "Tech Lead", "React Native"],
  location: "Niš, Serbia",
  availability: "Open to full-time roles and freelance projects · Remote",
  email: "nikola91bogdanovic@gmail.com",
  github: "https://github.com/Bogdastotel",
  linkedin: "https://www.linkedin.com/in/nikola-bogdanovic-082752177/",
  cv: "/cv/Nikola-Bogdanovic-CV.pdf",
  // TODO: drop a headshot in public/images/ and set its path here.
  photo: "",

  headline: "Web, mobile and backend, built end to end.",
  intro:
    "I'm Nikola, a full stack developer and tech lead with 7+ years of experience shipping web apps, APIs and iOS and Android apps, including Action Network with 10M+ monthly users. Off the clock I build 3D worlds and small games with Three.js.",

  bio: [
    "I focus on performance, clean architecture and a smooth user experience. I work across the stack (React, Next.js, Node.js, NestJS, React Native), so I can own a feature all the way through, from the database and API to the screen in someone's hand.",
    "Most recently I led a team of four at Knguru Studios, making the architecture calls, reviewing code and mentoring, while still shipping features myself.",
    "I use AI tools like Claude Code and Cursor every day: project rules, reusable commands, MCP integrations and plan, implement, test, fix loops for well-scoped work, always with human review before merge. It lets me ship faster without lowering the bar on code quality.",
  ],

  education: {
    degree: "M.Sc. & B.Sc. in Mechanical Engineering",
    school: "University of Niš",
    period: "2010 – 2018",
  },

  proof: [
    { value: "7+", label: "years building software" },
    { value: "10M+", label: "monthly users on Action Network" },
    { value: "4", label: "developers led as tech lead" },
    { value: "37%", label: "faster load time on Svenska Fans" },
  ],
} as const;

/** Absolute site origin, set once the production URL is known (no trailing slash). */
export const siteUrl: string = (import.meta.env?.VITE_SITE_URL ?? "").replace(/\/$/, "");
