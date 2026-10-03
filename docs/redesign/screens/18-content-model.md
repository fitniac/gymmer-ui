# Content model · Goals (categories), public Programs, Articles

**Boards:** D6 Programs, D7 Program · public detail, D8 Goal hub, D9 Articles, D10 Article · widgets,
24 Programs · discover, 25 Program · public detail, 26 Articles, 27 Article · widgets. Navigation: programs sit under **Library** next to exercises (tab strip Exercises | Programs | Goals),
articles under **Learn** — see `01-app-shell.md`. Touches: D1 Home
(new "A program for every goal" + "From the articles"), D2 Library (Goal filter), D3/04 Exercise (GOALS
chips, "In 6 programs"), 11 Programs (tab "Published" → "Discover"), public nav on 01–03.

Three new public entities. All three are **backend + admin work first**; the UI below assumes the
endpoints sketched here. Names are suggestions — align with `gobackend` conventions.

## 1. Goal (category)

A curated, small, translatable list. One entity, attached many-to-many to **programs, exercises and
articles**. Shown to users as "Goal" (never "category").

```ts
interface Goal {
  id: string
  slug: string                 // build-muscle, get-stronger, lose-fat, get-fit, move-better, train-at-home, first-steps
  name: Localized<string>
  description: Localized<string>   // one sentence, used as lede + meta description
  image: ReferenceImage | null     // 1:1 tile + wide hero crop
  order: number
  counts?: { programs: number, exercises: number, articles: number } // returned by list endpoint
}
// join fields
Program.goal_ids: string[]   // first = primary (shown on the card chip)
PublicExercise.goal_ids: string[]
Article.goal_ids: string[]
```

- Admin: CRUD + reorder; assign goals in the program, exercise and article editors (multi-select,
  first = primary). Bulk-assign for exercises from library filters (e.g. all bodyweight → Train at home).
- API: `GET /goals` (with counts) · `GET /goals/{slug}` · filters `?goal=slug` on
  `/programs/public`, `/exercises/public`, `/articles`; facet counts include `goal`.
  (API paths are unchanged by ADR 0001 — it moves *page* routes, not endpoints.)
- Routes: `/library/goals/[slug]` (D8 hub) — under `/library` so the URL matches the Library strip
  *Exercises · Programs · Goals* (ADR 0001). Goals also appear as filters on `/library/programs`,
  `/library`, `/articles`.

## 2. Public program

Today public programs exist (`programs/public/[id].vue`, `PublicProgramBrowser`). Extend the model:

```ts
interface PublicProgram {
  id, slug, name, summary, description (rich text), cover: ReferenceImage | null, trailer?: VideoRef
  goal_ids: string[]; level: 'beginner'|'intermediate'|'advanced'|'all'
  weeks: number; days_per_week: number; session_minutes: number; equipment: string[]
  phases: Array<{ name, weeks: [from, to], note }>
  days: Array<{ key: 'day-1', name: 'Push A', minutes, exercises: Array<{ exercise_id, sets, reps|time, rest_s, phase_overrides? }> }>
  who_for: string[]; progression: string
  author: 'gymmer' | { name }; updated_at; trained_count
  guide_article_id?: string
}
```

Actions: **Start this program** (copy into user's programs + schedule week 1; counts toward the Free
limit of 3 → existing `ProgramLimitUpsell` on 403) and **Copy and customise** (copy without starting).
Signed-out → `usePrimaryCta()` (waitlist pre-launch / signup after), then resume the action.

Routes — **settled by [`adr/0001-programs-route.md`](../adr/0001-programs-route.md) (accepted
2026-10-03)**: the public library is `/library/programs` (D6/24) and a public program is
`/library/programs/[slug]` (D7/25), both SSR and indexable. The authed `/programs` keeps its route,
its middleware and its deep links as "Mine" and gains a "Discover programs →" row.
`/programs/public/[id]` **301s** to `/library/programs/[slug]`; `/programs/browse` redirects to
`/library/programs`.

Rejected: one `/programs` serving both. It would hand a crawler — which is always signed out — the
Discover list at a URL every signed-in visitor sees as Mine.

## 3. Article

```ts
interface Article {
  id, slug, title, dek, body: ArticleBlock[], cover: ReferenceImage, topic: 'training'|'nutrition'|'recovery'|'mindset'|'program-guide'
  goal_ids: string[]; program_id?: string   // a "guide" belongs to one program
  author: { name, avatar? }; published_at; updated_at; read_minutes; locale
  related_ids?: string[]
}
type ArticleBlock =
  | { type: 'paragraph' | 'heading' | 'quote' | 'list' | 'image' | 'callout', ... }
  | { type: 'program', program_id }                       // program widget
  | { type: 'exercise', exercise_id, prescription?: '4×8' }   // single exercise widget (video + steps)
  | { type: 'workout', title, exercises: Array<{ exercise_id, prescription }> } // list widget
  | { type: 'takeaways', items: string[] }
```

Store body as structured blocks (not HTML) so widgets render as live Vue components and the same
article renders in the native app. Admin editor: block editor with widget pickers (search exercise /
program).

### Widgets (one component each, used in articles and reusable elsewhere)
- `ProgramWidget` — 3:4 cover, "THIS GUIDE GOES WITH", name, meta, **Start program**, **See all 8 weeks**.
- `WorkoutWidget` — header "WORKOUT · PUSH A · 4 exercises · ~60 min" + **Start this workout**; rows with
  `ExerciseThumb expandable` (→ exercise sheet), name (→ exercise page), prescription, **+ Add** (→
  pick a program, default = last used; button turns "✓ Added"); footer "+ Add all N to a program".
- `ExerciseWidget` — looping 3:4 clip, name, 3 steps, **+ Add to program**, **Variations** (→ sheet,
  Swap tab).
- After any add/start: toast "Barbell Bench Press added to Chest Day · Open" (undo inside the toast).
- Signed-out: same buttons, routed through `usePrimaryCta()`; the intended action is stored and replayed
  after signup.

Routes: `/articles` (D9/26), `/articles/[slug]` (D10/27).

## Screens

### Programs library — D6 (desktop), 24 (phone)
Hero "A program for every goal." + stats · **goal tiles** (1:1 image, name, count; selecting filters,
deselect returns to sections) · filter bar (Level, Days/week, Equipment, count) · default view: one
section per goal (title, one-line description, "See all N →", 4 program cards) · goal selected: grid +
link "Everything for {goal}" → goal hub · Nova band "None of these fit your week? Build mine with Nova" ·
SEO link block (by goal / schedule / kit). Phone: goal chips (scrolling) + horizontal 3:4 card rails per
goal; goal selected → 2-col grid; Nova card.
**Program card:** 3:4 cover, primary goal chip(s) top-left, level label + name over a bottom gradient,
meta "8 weeks · 6×/week · 60 min", equipment.

### Program detail — D7 / 25
Desktop: 3:4 cover/trailer left · goal chips, H1, summary, 5 fact tiles (length, frequency, session,
level, kit), **Start this program** + **Copy and customise** + "Free · uses 1 of your 3 program slots",
author line · **The plan**: phase `GmSegmented` (Weeks 1–2 Foundation / 3–6 Build / 7–8 Peak) with a
note, 6 day cards each listing exercises with thumbs (→ sheet) and prescriptions that change with the
phase · sticky aside: `GmBodyMap` "What you'll train" + sets-per-week bars, guide article card · Who
it's for / How it progresses · related programs.
Phone: cover hero with title over gradient, facts row, body map, phase segmented + **day accordion**
(first day open), guide card, sticky bar [copy] + **Start this program · Free · week 1 starts today**.

### Goal hub — D8
Hero with image wash, "GOAL", H1, description, three count pills that jump to sections · other-goal
chips · Programs (4) · Exercises (6 × 3:4) · Articles (3). One SEO page per goal (`CollectionPage` JSON-LD).

### Articles — D9 / 26
H1 + search · topic `GmSegmented` (All · Training · Nutrition · Recovery · Mindset · Program guides) +
goal chips · featured: lead (3:2, big title, excerpt) + 2 side cards (only when unfiltered) · grid of 3 ·
"Load more" (real paginated links) · weekly email band (waitlist/newsletter).
**Article card:** 3:2 cover, topic pill, accent "Guide · {program}" badge when `program_id`, goal label,
title, excerpt, "6 min read · 24 Sep". Phone: topic chips, lead card, then compact rows (text left,
3:2 thumb right).

### Article — D10 / 27
Desktop: breadcrumb, topic + goal chips, H1 (54/800), dek, author · date · read time, share, 21:9 hero ·
3 columns: sticky TOC (active section marked) · 700px body with widgets · sticky "Follow along" program
card + goal links · Key takeaways (accent tint) · disclaimer · Keep reading (3). Phone: same body single
column, 3:2 hero, sticky bottom bar with the guide's program and **Start**.

## SEO
- `/library/programs`, `/library/programs/[slug]`, `/library/goals/[slug]`, `/articles`, `/articles/[slug]` are SSR, indexable,
  localized (`hreflang`), canonical without filter params.
- JSON-LD: `ItemList` (lists), `ExercisePlan`-style `HowTo` for program days, `Article` + `BreadcrumbList`
  for articles (author = organization unless a named author exists).
- Internal linking: every article ↔ its program and goals; every exercise page lists goals and "In N
  programs"; goal hubs link all three types.

## Plans / Pro
Starting or copying a public program counts toward the Free limit (3). No content is paywalled; Pro is
not promoted on these pages beyond the existing limit sheet.

## Acceptance
- [ ] A goal assigned in admin appears as a chip/filter on programs, exercises and articles without a release.
- [ ] Every widget action works signed-in (writes via existing program endpoints) and replays after signup when signed-out.
- [ ] Program phase switch changes prescriptions on every day card.
- [ ] Lighthouse SEO ≥ 95 on all five route types; articles render without client JS (widgets hydrate).
