# Kickoff prompt for Claude Code

Paste the block below into Claude Code, started in `~/Projects/gymtracer` (the parent folder, so it
can see `gymmer-ui`, `gymmer-nuxt` and `gobackend`). For later phases, use the short template at the
end.

---

```text
You're implementing the GYMMER redesign. The full handoff is in gymmer-ui/docs/redesign/ — it is the
source of truth for what to build. Read before you write any code:

1. gymmer-ui/docs/redesign/README.md            (how to use the folder, decisions D1–D10 in §3, spec index)
2. gymmer-ui/docs/redesign/03-implementation-plan.md   (phases, PR list, flags, risks)
3. gymmer-ui/docs/redesign/00-foundations.md   (tokens, type, radius, motion, icons, logo, media)
4. gymmer-ui/CLAUDE.md and gymmer-nuxt/CLAUDE.md (repo rules — they still apply)
Design reference: gymmer-ui/docs/redesign/design/*.dc.html (markup snapshots of every board; they
need a canvas runtime to render, so read them for sizes, spacing, copy and states — never import them).
design/README.md maps each board to its spec.

Decisions already made by me (Igor) — treat as signed off:
- D1 soft corners (card 12 / control 7 / pill 999) with a user corner setting square/soft/round
- D2/D3 Google Sans Flex for UI text, Archivo for headlines; no IBM Plex Mono
- D6 keep "system" as default theme; D7 keep the closed accent list (new palettes only via theme.ts + contrast test)
- D8 5-tab bar: Today (small G) · Programs · Train (centre, barbell) · Library · Coach; Progress via Today
- D9 keep the prelaunch flag (waitlist vs signup CTAs)
- D10 guest nav: phone Home · Library (Exercises | Programs) · [Join free] · Learn · Sign in;
  desktop Library (Exercises · Programs · Goals) · Learn · Apps
- Header logo: variant A6 — G is 2.5% larger than YMMER, top-aligned, 0.5px below the baseline, no shadow
Still open — do NOT implement, keep current behaviour behind a token/flag and list them for me:
- D4 colour vs black-and-white photography, D5 removing offset shadows on app surfaces
- O1–O4 in 02-plans-and-monetisation.md (Nova free quota, Pro removes ads, ad provider, trial price)

Your first task — Phase 0 + Phase 1 only:
A. Phase 0 checks (no code): verify Google Sans Flex has latin-ext, Cyrillic and Greek subsets via
   @nuxt/fonts for every locale gymmer-nuxt ships; propose the /programs route decision (one page,
   Mine | Discover); update docs/redesign/README.md §3 marking D1, D2, D3, D6–D10 as approved.
   Report back before moving on if any check fails.
B. Phase 1 in gymmer-ui, one branch + one commit per plan item 1.1–1.6
   (branch names redesign/1.1-tokens, redesign/1.2-corners, …):
   new tokens, data-corners axis (SSR + no-flash script + useTheme), font split, GmLogo
   variant="wordmark-g" with the A6 overshoot in em units, gymmer-g and barbell glyph SVGs,
   CLAUDE.md/README.md rules updated to the approved decisions, version bump to 0.3.0.

Working rules:
- Behaviour first, pixels second. Each spec lists behaviour that must survive (outbox writes, popup
  URL history, rest-sheet confirm card, 403-as-upsell…). Never trade it for looks.
- Tokens only, no colour literals; pnpm test:contrast after any token change; pnpm brand:verify if
  you touch the logo.
- Do not change gymmer-nuxt in this task except to verify the layer still builds against it
  (link it with the workspace override, run nuxt build + typecheck, take screenshots).
- If a spec and a design board disagree, the board wins — fix the spec in the same commit.
- Don't push or open PRs; commit locally on the branches and stop.
- When done, give me: what changed per branch, test results, screenshots at 390/834/1440 light+dark
  of the kitchen-sink page, anything you couldn't do, and the next PRs you'd take from Phase 2.
```

---

## Template for later phases

```text
Continue the GYMMER redesign. Re-read gymmer-ui/docs/redesign/03-implementation-plan.md and the
specs for Phase <N> (<spec files>). Implement items <N.x–N.y> in <repo>, one branch + commit each
(redesign/<N.x>-<slug>), behind flag <flag> where the plan says so. Preserve every behaviour the specs
list under "must survive"; keep existing tests green and add the ones in each spec's Acceptance.
Compare against the boards <board names> in docs/redesign/design/. Don't push. Report per branch:
changes, tests, screenshots at 390/834/1440 light+dark, open questions, and anything in the spec you
had to change.
```
