# Portfolio plan

Working plan for this site, with current status. Last updated 2026-11-27.

## Goal

A personal portfolio whose first job is winning interviews (React Native / Tech Lead / full-stack roles) and whose second job is bringing in freelance web and mobile work. The reference is dejanmilenkovic.com: a homepage of numbered sections plus one case-study page per project. That site is aimed at clients; this one puts recruiters first, clients second.

## Decisions

| Topic        | Decision                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Stack        | React Router (framework mode) on Vite, TypeScript, prerendered to static HTML (`ssr: false` + `prerender`)                     |
| Styling      | Tailwind CSS v4, colour tokens as CSS variables, dark by default with a light toggle                                           |
| Animation    | CSS scroll-driven reveals only (no animation library), so content is visible without JavaScript                                |
| Content      | Typed TS files in `app/content/`, no CMS                                                                                       |
| Fonts        | Self-hosted via Fontsource: Space Grotesk (display), Inter (text), JetBrains Mono (labels)                                     |
| Language     | English only                                                                                                                   |
| Contact      | `mailto:` links, copy-email button, GitHub, LinkedIn. No form in v1; Web3Forms could be added later without a backend.         |
| Hosting      | Vercel free tier on a `*.vercel.app` URL, custom domain later. Cloudflare Pages is the fallback; output is plain static files. |
| Repo         | `Bogdastotel/portfolio`, public                                                                                                |
| Phone number | Not shown on the site (it is still inside the CV PDF)                                                                          |

## Site structure

**`/` home**

1. Hero: roles, headline, intro, `View work` and `Download CV`, availability line, four proof numbers
2. Selected work: four case-study cards in phone frames
3. Services: mobile apps, web apps, APIs and backends, tech leadership
4. Experience: Knguru Studios, Better Collective, Codeus (with its four client apps), Brame, Softelm
5. Skills: Mobile, Frontend, Backend, Databases, AI tools
6. About: bio, photo, education
7. Contact: "Hiring?" and "Have a project?" cards

**`/work/:slug`**: `action-network`, `deepdays`, `clubkit`, `svenska-fans`. Each has role facts, overview, what I worked on, results, stack, screenshots, store links, next project.

**Unknown URLs** render a 404 page (`build/client/404.html`, copied from the SPA fallback at build time).

## Status

### Done

- [x] Scaffold, lint, format, typecheck, CI workflow (first run passed)
- [x] Design tokens, layout shell, header, footer, theme toggle, base UI components
- [x] First-draft content from the CV in `app/content/`
- [x] Home page, all sections
- [x] Case-study template and four entries, all prerendered
- [x] Per-page titles and descriptions, JSON-LD `Person`, `robots.txt`, favicon
- [x] Repo created and pushed

### To do

- [ ] **Deploy to Vercel**: import the repo at vercel.com/new (settings come from `vercel.json`), note the production URL
- [ ] **Set `VITE_SITE_URL`** in Vercel to the production origin; this turns on canonical and Open Graph URL tags
- [ ] **Open Graph image** at `public/og/default.png` (1200×630); `app/lib/seo.ts` already points at it
- [ ] **Sitemap** (`sitemap.xml`) and a `Sitemap:` line in `robots.txt`, once the URL is known
- [ ] **Case-study copy**: currently limited to what the CV says, so pages are thin, especially ClubKit and DeepDays. Expand in `app/content/projects.ts`.
- [ ] **Confirm tech stacks** for Action Network and Svenska Fans (React Native + TypeScript was assumed)
- [ ] **Confidentiality check** with Better Collective / Knguru on naming metrics and showing screenshots
- [ ] **Screenshots** in `public/images/projects/<slug>/`, referenced from `projects.ts` (phone frames show coloured placeholders until then)
- [ ] **Store links** per project (`links` in `projects.ts`)
- [ ] **Headshot** in `public/images/`, path set in `profile.ts` (`photo`)
- [ ] **LinkedIn URL** in `profile.ts` (`linkedin`); the links stay hidden while it is empty
- [ ] **CV file**: `public/cv/Nikola-Bogdanovic-CV.pdf` is 10.7 MB and contains the phone number. Replace with a compressed, phone-free export.
- [ ] **CV dates**: confirm whether Knguru (06/2025 – 10/2026) or Better Collective (08/2023 – 11/2026) should read "Present"; update `experience.ts`
- [ ] **Node**: React Router 8 wants Node above 22.22; local builds on 20.19 work with a warning. Switch to 22 (`.nvmrc` is set).
- [ ] **Polish pass**: check the light theme, keyboard navigation, reduced motion, and tablet width
- [ ] **Lighthouse** on the deployed site: target 95+ for Performance, Accessibility, Best Practices, SEO
- [ ] **Link previews**: check `/` and one case study in LinkedIn Post Inspector after deploy
- [ ] **Custom domain**, when bought

### Later, if wanted

- Contact form (Web3Forms)
- Second language (Serbian or German)
- Analytics (Vercel Analytics or Plausible)
- Bump GitHub Actions versions in `.github/workflows/ci.yml` (Node 20 deprecation warning)

## Verification checklist

- `pnpm lint`, `pnpm typecheck`, `pnpm build` pass locally and in CI
- `build/client/index.html` and each `build/client/work/<slug>/index.html` contain the real headings and copy
- `pnpm preview`, then walk every route at phone, tablet and desktop widths in both themes
- After deploy: production URL loads, CV downloads, `mailto:` and copy-email work, unknown URLs show the 404 page
