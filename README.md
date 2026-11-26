# Portfolio

Personal site of Nikola Bogdanovic: React Native developer, tech lead, full stack.

Built with React Router (framework mode) on Vite, TypeScript and Tailwind CSS. Every page is prerendered to static HTML at build time, so there is no server to run.

## Develop

```sh
pnpm install
pnpm dev        # http://localhost:5173
```

## Check and build

```sh
pnpm lint
pnpm typecheck
pnpm build      # static site in build/client
pnpm preview    # serve the built site locally
```

## Editing content

All copy lives in `app/content/`:

| File            | Holds                                           |
| --------------- | ----------------------------------------------- |
| `profile.ts`    | Name, headline, bio, links, proof numbers       |
| `projects.ts`   | Case studies; each entry becomes `/work/<slug>` |
| `experience.ts` | Work history                                    |
| `services.ts`   | Freelance services                              |
| `skills.ts`     | Skill groups                                    |

Screenshots go in `public/images/projects/<slug>/` and are referenced from `projects.ts`. The CV is `public/cv/Nikola-Bogdanovic-CV.pdf`.

## Deploy

Static output in `build/client`; `vercel.json` configures Vercel. Set `VITE_SITE_URL` to the production origin (for example `https://example.com`) to turn on canonical and Open Graph URL tags.
