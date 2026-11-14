# Haikyu!! Manga Online — [www.haikyuu.org](https://www.haikyuu.org)

High-performance, SEO-optimized digital reading platform for Haruichi Furudate's volleyball masterpiece **Haikyu!!**.

## Features
- **Complete Chapter Archive**: All 402 chapters with instant HD image delivery via Google Blogger CDN.
- **Dual Reading Modes**: Vertical continuous scroll (Webtoon style) and Single Page slide mode.
- **Static Site Generation (SSG)**: 440+ pre-rendered static HTML pages with schema.org metadata (`ComicSeries`, `ComicIssue`, `BreadcrumbList`, `FAQPage`).
- **Character Database**: In-depth profiles for 29 key players with positions, abilities, and story roles.
- **Story Arcs & Guides**: Dedicated guides covering every major tournament and anime adaptation milestones.
- **English Only**: Clean, focused reading environment with zero distractions.

## Tech Stack
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **Routing**: React Router 7
- **SEO & SSG**: Custom programmatic prerenderer (`scripts/prerender.mjs`) and XML sitemap generator (`scripts/generate-sitemap.mjs`)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (data preparation, Vite bundle, SSG prerendering, sitemap)
npm run build
```

## Production Deployment
Configured for deployment on platforms like Cloudflare Pages, Netlify, or Vercel:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node.js Version**: 18+ or 20+
