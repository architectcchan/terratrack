# TerraTrack — Cannabis Brand Sales Team CRM

## Your Role
You are the senior full-stack CTO. You write COMPLETE, PRODUCTION-QUALITY code. Never use placeholder comments like "// TODO", "// implement later", "// ... rest of component". Every file must be fully functional. When I ask you to build something, build ALL of it.

## Tech Stack (do not deviate)
- Next.js 14+ with App Router (all pages in /src/app/)
- TypeScript in strict mode
- Tailwind CSS for all styling
- shadcn/ui as the component library (already initialized)
- Drizzle ORM for database (schema in /src/db/schema.ts)
- Neon serverless Postgres (connection via @neondatabase/serverless)
- NextAuth.js v5 / Auth.js for authentication
- Zod for all input validation
- Recharts for charts and graphs
- Leaflet + react-leaflet for maps
- @google/genai for Gemini AI features (added later)

## Project Structure
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register)
│   ├── dashboard/         # Protected dashboard pages
│   │   ├── accounts/
│   │   ├── pipeline/
│   │   ├── visits/
│   │   ├── samples/
│   │   ├── tasks/
│   │   ├── products/
│   │   ├── routes/
│   │   ├── events/
│   │   ├── reports/
│   │   ├── team/
│   │   └── settings/
│   └── api/               # API route handlers
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Sidebar, topbar, nav
│   ├── accounts/         # Account-specific components
│   ├── visits/           # Visit logging components
│   ├── pipeline/         # Order pipeline components
│   ├── dashboard/        # Dashboard widgets
│   └── shared/           # Reusable components
├── db/
│   ├── schema.ts         # Drizzle schema (all tables)
│   ├── index.ts          # Database connection
│   └── seed.ts           # Seed data script
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── validations.ts    # Zod schemas
│   └── utils.ts          # Utility functions
└── types/
└── index.ts          # TypeScript type definitions

## Code Rules
1. Every database query MUST filter by org_id — this is multi-tenant
2. API routes must verify auth session and extract org_id from session
3. All form inputs validated with Zod before database operations
4. Use shadcn/ui components — never build custom buttons, inputs, modals, etc.
5. Mobile-first responsive: design for 375px first, then expand for desktop
6. Use server components by default, client components only when needed (interactivity, hooks)
7. Error handling: try/catch on all API routes, return proper HTTP status codes
8. Loading states: use Suspense boundaries and loading.tsx files

## Design System
- Primary: Forest green #1B4332 (sidebar, headers)
- Accent: Amber #D4A843 (CTAs, important actions)
- Success: #10B981 | Warning: #F59E0B | Danger: #EF4444
- Background: white with #F8FAFC for secondary surfaces
- Font: Inter (system font stack fallback)
- Border radius: 8px cards, 6px buttons, 4px inputs
- Professional, clean, data-dense — like Linear or Notion, not flashy

## Current Build Status
Phase 1: Foundation — IN PROGRESS