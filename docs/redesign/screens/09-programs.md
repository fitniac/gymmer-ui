# Screen · Programs

**Board:** 11 Programs (tweak `plan`).

**Route & files:** `pages/programs/index.vue` (346 lines), `components/media/ProgramThumb.vue`,
`programs/PublicProgramBrowser.vue` (moves to `/library/programs` — ADR 0001), `useProgramLimit.ts`, `stores/programs.ts`.

## Layout — phone
1. H1 "Programs". **No Mine | Discover segment** — ADR 0001 (accepted): this page is Mine only, and
   the public library is its own route. Under the H1, one full-width **"Discover programs →"** row
   (`--gm-surface`, 1px `--gm-hairline`, chevron right) linking to `/library/programs`.
   A row rather than a segment because the two halves are different kinds of thing — yours and
   editable vs published and copyable — and because a segment whose other half is a different page
   lies about where tapping it takes you. It also survives the empty state, where a segment with one
   populated half reads as broken.
2. Free meter: "1 of 3 programs on Free" + 3-segment bar + "Unlimited with Pro" link (Pro: hidden).
3. Program card: `ProgramThumb` / `GmBodyMap` mini on the left, level badge, name 20/800, caption
   "4 exercises · 10 sets · ~45 min", muscles, last trained ("Not trained yet"), primary small "Start"
   and overflow menu (rename, duplicate, delete — existing `GmMenu`).
4. **Add another** section with three option rows (icon, title, one-line description, chevron):
   "Let Nova build it" · "Copy a published plan" · "Start blank" → create screen with the mode preset.
   At the limit on Free, tapping any opens `ProgramLimitUpsell` (existing trigger).
5. Tab bar.

## Acceptance
- [ ] Limit handling unchanged (server 403 `program_limit` → upsell).
- [ ] Each "Add another" row opens create with the matching mode selected.
