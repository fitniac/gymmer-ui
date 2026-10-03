# Screen · Library (hub, facet list, signed-in library)

**Boards:** 02 Library, 03 Muscle · Back, T2 Library, D2 Library · browse & filter (SEO, interactive).

**Route & files:**
- Public hub `pages/library/index.vue` (208) — SEO, `layout: false`.
- Public facet list `pages/library/[facet]/[slug].vue` (294) — SEO; `FacetHero`, `ExerciseCard`.
- Signed-in library `pages/exercises/index.vue` (420) — filters (`ExerciseFilterPanel`,
  `ExerciseFacetRail`), popup (`ExerciseDetailModal`).
- `utils/facetOptions.ts`, `utils/libraryQuery.ts`, `#shared/libraryUrl` (`facetPath`,
  `FACET_MIN_EXERCISES`), `useBrowseGate`, `useCenteredPreview`.

## Purpose
Browse ~412 exercises **by muscle or by equipment** (both must stay — Igor), find one by name, and
open it fast. Public pages must rank (crawlable lists, real links, server-rendered counts).

## Phone — hub (02)
H1 "Library" + "412 exercises, each checked by a human." · search field (pill) · `GmSegmented`
**Muscle | Equipment** · 2-column grid of `FacetTile` (1:1 image: muscle render / equipment photo,
name, count) — each a real `<a href>` to its facet page · "Featured today" (same daily pick as
Home) as 3:4 `ExerciseCard`s with a VIDEO pill. The Muscle/Equipment switch swaps the grid client-side
**but both grids are in the SSR HTML** (the hidden one `hidden`), so crawlers see every facet link.

## Phone — facet list (03 Back)
Back "‹ Library" · H1 "Back" + "72 exercises" · equipment chip filter (All · Barbell · Cable · …;
on an equipment facet the chips are muscles) · list rows: `ExerciseThumb lg expandable` (72×96, expand
badge, opens the exercise sheet in library context) + text link (name 16/700, muscles 13 muted,
equipment label) → exercise page + chevron. **Two targets per row**; never wrap both in one link.

## Tablet (T2)
Rail · H1 + search + Muscle/Equipment segmented control on one row · 4-col `FacetTile` grid ·
Featured 4-up.

## Desktop (D2)
1. Site header (Exercise library active) · breadcrumb Home / Library / {facet}.
2. H1 "Exercise library" (or "{Muscle} exercises" on a facet) 56/800 + lede; stats 412 EXERCISES ·
   24 MUSCLES · Free NO ACCOUNT NEEDED.
3. `GmSegmented` Muscle | Equipment + hint ("24 muscle groups · tap to filter") · 8-col `FacetTile` row.
4. Two-column body: **sticky filter sidebar** 240px (search, **Goal** chips (from the Goal entity), Equipment checkboxes with counts, Level
   chips, Type chips Strength/Cardio/Stretching, "Turn any of these into a plan" card → signup /
   waitlist) · **results**: count, removable active-filter chips, Sort (Most popular · A–Z · Newest),
   Grid/List toggle; 4-col `ExerciseCard` grid or list rows; "Show 24 more" + numbered pagination
   (real `?page=` links).
5. SEO block "Every exercise, explained." + 4 link columns (Upper body, Lower body, Equipment, At home).
6. Footer.

## Data
`GET /exercises/public/facets` for counts (already one call); list via `libraryQuery`. Filter state
lives in the URL query (shareable, crawlable canonical without filters). Facet links only for values
≥ `FACET_MIN_EXERCISES`.

## SEO
- `<title>`: "Back exercises — 72 with video | GYMMER"; meta description from lede; canonical without
  sort/view params; `ItemList` JSON-LD of the first page; breadcrumb JSON-LD.
- Pagination: real links, `rel` hints optional; "Show more" enhances progressively.
- Everything above renders on the server; no content behind client-only toggles.

## Interactions & motion
Tile/list enter stagger (first 8). Desktop card hover preview (component spec). Phone: centred-card
autoplay as today. Filter changes animate the count and fade the grid 150ms.

## Signed-out limits
Keep `useBrowseGate` (soft gate after N exercise opens — board 06) on exercise pages, not on lists.

## Acceptance
- [ ] Muscle and Equipment browsing both present on hub (all sizes) with images.
- [ ] Facet list rows: thumb opens sheet, text opens page.
- [ ] Desktop filters reflected in URL; back/forward restores them.
- [ ] Lighthouse SEO ≥ 95 on hub and a facet page; no CLS from images (GmAspect).
