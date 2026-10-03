# Kickoff prompt — Phase 5 (content model) in gobackend + admin

Start Claude Code in `~/Projects/gymtracer` (so it sees `gobackend`, `admin`, `gymmer-nuxt`,
`gymmer-ui`). Runs in parallel with the front-end Phase 3 session — different repos, no shared files.

```text
You're building the backend for three new public content types in the GYMMER redesign: Goals
(categories), public Programs, and Articles. The front end is being built separately; your job is the
data, the API and the admin. Read first:

1. gymmer-ui/docs/redesign/screens/18-content-model.md  — the model, endpoints, routes, widgets, SEO
2. gymmer-ui/docs/redesign/adr/0001-programs-route.md   — public programs live at /library/programs,
   goals at /library/goals/[slug], /programs stays the user's own list
3. gymmer-ui/docs/redesign/03-implementation-plan.md §Phase 5 (items 5.1–5.7)
4. gymmer-ui/docs/redesign/02-plans-and-monetisation.md — Free limit of 3 own programs (start/copy of a
   public program counts toward it; the existing 403 code "program_limit" must be reused)
5. gobackend's own CLAUDE.md / docs and admin's — their conventions win over my sketches
Design reference for what the screens need: gymmer-ui/docs/redesign/design/DeskPrograms, DeskProgram,
DeskCategory, DeskArticles, DeskArticle, ProgramsLib, ProgramPublic, Articles, Article (.dc.html —
read for fields and states; they don't render outside the canvas).

Before writing code — survey and report (no code yet):
A. What already exists: public programs (gymmer-nuxt has pages/programs/public/[id].vue and
   PublicProgramBrowser), exercise facets (GET /exercises/public/facets), i18n/localized fields,
   reference images, the body-map admin (per sex and view), auth/permission model for admin writes.
B. Map 18-content-model.md onto it: which fields are new, which exist under other names, what the
   migration is for existing public programs (slugs, phases, days, prescriptions). Flag every place my
   sketch conflicts with existing conventions — propose the convention-respecting version.
C. A short plan for 5.1–5.6 with the order you'd do them in, the endpoints (method, path, auth,
   response shape), indexes, and how goal counts / facet counts are computed and cached.
Stop after A–C and wait for my go.

Then, once approved, the build order:
5.1 Goal entity (+ localized name/description, image, order) and goal_ids on programs, public
    exercises and articles; GET /goals with counts; ?goal= filters and goal facet counts on
    /programs/public, /exercises/public, /articles.
5.2 Admin: goal CRUD + reorder; multi-select goal pickers (first = primary) in program and exercise
    editors; bulk-assign from library filters.
5.3 Public program extension: slug, cover/trailer, phases, days with prescriptions + per-phase
    overrides, who_for, progression, guide_article_id, trained_count; "start" and "copy" endpoints
    that respect the Free limit; 301 data for /programs/public/[id] → /library/programs/[slug].
5.4 Admin: public program editor (phases × days × exercises), publish workflow.
5.5 Article entity with structured blocks (paragraph, heading, quote, list, image, callout, program,
    exercise, workout, takeaways), topic, goals, program_id, author, locale, read time; list + detail.
5.6 Admin: block editor with exercise/program pickers, preview, publish.
5.7 Seed: 7 goals, ≥9 programs, ≥8 articles incl. one guide per flagship program (I'll review copy).

Rules:
- One branch + commit per item (content/5.x-…), migrations reversible, tests for every endpoint
  (happy path, auth, Free-limit 403, locale fallback, unknown goal slug → 404).
- Public read endpoints are cacheable and must not leak unpublished content; admin writes require the
  existing admin permission.
- Structured article blocks are stored as data, never as HTML; reject unknown block types.
- Body map / program thumbs: the reader's profile sex selects the figure (male/female masks already
  exist in the body-map admin) — expose nothing new unless the survey shows it's missing.
- Don't push; don't touch gymmer-nuxt or gymmer-ui except to update 18-content-model.md where the
  real API differs from my sketch (same commit as the API change).
- Report per branch: what changed, migrations, endpoint list with example responses, tests.
```
