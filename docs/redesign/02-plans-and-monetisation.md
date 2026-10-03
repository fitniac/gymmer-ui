# 02 · Free vs Pro, ads, trial, pre-launch

Product rules as stated by Igor, and how every screen applies them. The tone is **promote, never
push**: one quiet line or one tinted card per screen, no blocking modals except the program limit.

## Plans

| | Free (forever) | Pro |
|---|---|---|
| Exercise library, videos, instructions | Full | Full |
| Logging workouts | Unlimited | Unlimited |
| Workout history visible | Last 30 days | Forever |
| Own programs | Up to 3 | Unlimited |
| Nova (AI coach) | Reviews some finished workouts at random; a few questions per week | Reviews every workout; ask any time (fair use) |
| Ads | Rest timer and timed cardio only | None *(open question O2)* |
| Trial | — | 7 days free, once per account |

Naming in UI: **Free** and **Pro**. The code says "Premium" (`usePremium`, `ProgramLimitUpsell` copy)
— rename user-facing strings to "Pro"; identifiers can stay.

Entitlement source stays `usePremium()` (403 on `/user/goals` = free). New needs:
- **Trial state** (`trial_ends_at` or equivalent) for "Trial · 5 days left" in Settings — backend.
- **Nova quota** (remaining questions this week) for the Coach line — backend; until it exists, hide
  the dots and show only "Ask any time with Pro".
- **History window** enforced server-side; the client shows the lock, it does not filter.

## Touchpoints (every place Pro appears)

| Screen | Free shows | Pro shows | Component |
|---|---|---|---|
| Today (09) | History chart beyond 30 days greyed with "PRO" tag → `ProSheet(trigger:'history')` | Full chart | `ProNudge` |
| Progress (23) | Range control: "30 days" active; "Year" and "All" carry a `PRO` tag and open `ProSheet` | All ranges | `GmSegmented` + tag |
| Programs (11) | "1 of 3 programs" meter under the list; at 3 the create button opens `ProSheet(trigger:'program_limit')` | No meter | `ProNudge`, `ProgramLimitUpsell` |
| Coach (18) | "●●○ 2 questions left this week · Ask any time with Pro" above the composer | Nothing | `ProNudge` |
| Rest (20) and rest overlay (15) | `AdSlot` under the last-set editor | Nothing | `AdSlot` |
| Timed cardio (16) | `AdSlot` under the ring | Nothing | `AdSlot` |
| Workout complete (17) | Nova review only when this workout was picked; otherwise a footnote "Nova reviews some workouts on Free · every workout on Pro" | Nova review always | `NovaCard`, `ProNudge` |
| Settings (19) | "You're on Free" card with "Try Pro free for 7 days" | "PRO · Trial · 5 days left · Manage" | card |
| Home (01, D1) | **No prices, no plan comparison.** Message is "Free forever: full library, logging, up to 3 programs". | — | copy |

Rules:
- At most **one** Pro touchpoint visible per screen at a time.
- Never interrupt a set, a timer or the save of a workout with an upsell.
- Every touchpoint opens the same `ProSheet` with a `trigger` for analytics
  (`services/analytics.ts`: event `Pro Sheet Open {trigger}` and `Trial Start {trigger}`).

## Ads

- Only on **rest** and **timed cardio** — the two moments the user waits with nothing to do.
- Native format, 320×72 on phone, no sound, no autoplay video, no interstitials, never covers the
  timer or the controls. Labelled `AD`.
- Gate: `usePremium().showAds` (true only once we know the account is free). Native app and web use
  the same slot; the ad SDK choice is open (O3).
- `prefers-reduced-motion`: static creatives only.

## 7-day trial (board 21)

Sheet content, top to bottom: G mark on accent tint · "Try Pro free for 7 days" · 4 benefit rows
(history forever, Nova on every workout, unlimited programs, no ads) with the user's current Free
value struck/muted beside each · price line after the trial ("then €X/month, cancel any time" —
amount from the store, never hard-coded) · primary "Start free trial" · secondary "Not now" ·
legal line. Reminder notification 2 days before the trial ends (local notification on native).

Purchase is through App Store / Google Play on native and the web checkout on web — out of scope for
this UI refactor; the sheet calls a `startTrial(trigger)` service stub.

## Pre-launch

`config.public.prelaunch` (default true) keeps today's behaviour: primary CTAs on Home, the exercise
page and the soft gate go to the waitlist form, store buttons read "Coming soon". When false, the
same slots become "Create free account" and live store links. One computed `primaryCta` in a
composable (`usePrimaryCta()`), never `v-if` scattered across sections.

## Open questions

- **O1** Free Nova question allowance per week (mockups say 3).
- **O2** Does Pro remove ads? Mockups say yes ("Remove ads with Pro").
- **O3** Ad provider for web + Capacitor.
- **O4** Trial price and currencies per store.

### O5 — a Cyrillic + Greek face for UI *and* display (pre-existing, surfaced by Phase 0.3)

Not created by the redesign. In `ru`, `ua`, `bg` and `gr` every Cyrillic or Greek character
already falls back to `system-ui`: Archivo has no Cyrillic or Greek subset, and neither does Google
Sans Flex (measured 2026-10-03 — see `README.md` §3a). Fallback is per character, so a line mixing
the brand name with translated copy is set in two faces today. Four of 25 locales have therefore
never seen the brand face on their own script, and adopting Google Sans Flex changes nothing for
them either way.

It covers **both faces**, not just the UI one. Archivo is also the display face (`--gm-font-display`,
h1–h3 and `.display`), and it has no Cyrillic or Greek either — so in those four locales the page
*title* falls back as well, not only the body. Whatever is chosen has to answer for headlines at
800 weight and `font-stretch` as well as for 15px body copy.

The question is whether to pick a Cyrillic+Greek family for those four and scope it with
`html:lang(...)`, exactly as EB Garamond was chosen for the quote face — or to accept `system-ui`
there, which is what ships today and what nobody has reported.

Candidates to evaluate when it is taken up:

| Family | Why it is a candidate | What to check |
|---|---|---|
| **Roboto Flex** | variable, full Cyrillic + Greek, has a `width`/`GRAD` axis so it can approach Archivo's wide 800 headline | whether the widest instance reads as the same voice as Archivo at display size |
| **Noto Sans** | the widest script coverage on Google Fonts; designed as a fallback, so it never drops a glyph | plainer than Archivo — fine for UI, weakest as a display face |

Deciding costs: one family in `nuxt.config.ts`, an `html:lang` block in `tokens.css` setting **both**
`--gm-font-ui` and `--gm-font-display`, and a look at the four locales side by side at headline and
body size. Deferring costs nothing new; it just leaves the status quo in place.
