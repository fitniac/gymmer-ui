# Gap list — every canvas board against production, 2026-11-04

Replaces `review/gap-list.md` (2026-10-20, against `main` `95b7c16`). Surveyed
**2026-11-03 20:0xZ** against `main` **`622434c9`**, released as
**`v2026.11.03-1`** (web) with **`v2026.11.03-2`** (API). **62 boards** in
`docs/redesign/design/*.dc.html`.

Other lanes take their rows from this file.

## The statuses, and the one I had to add

| status | means |
|---|---|
| **live + matches** | on `main`, deployed, and a frame has been compared to the board |
| **live + drift** | on `main`, deployed, and a named difference from the board |
| **live, unverified** | on `main` and deployed, but **no frame has been diffed against the board** |
| **built, flag-off** | on `main` and deployed, but a runtime flag makes it unreachable |
| **not built** | no route or component implements the board's subject |
| **other repo** | the subject is not gymmer-nuxt's |

**"live, unverified" is not a hedge, it is most of the list.** The old gap list
said "built" for these and warned in its own preamble that it would "be wrong in
the way only a screenshot can catch". Calling them "matches" without a diff
would repeat that. A row is only **live + matches** here if a frame in
`review/` was actually compared; everything else that exists says so.

**Flags as production serves them**, measured not assumed:

```
prelaunch:true   learn:false   billingEnabled:false   native:false
```

**Public routes, measured:**

```
200  /  /library  /exercises  /pricing  /programs  /programs/days/2  /programs/goal/strength
404  /articles (learn:false)   /account/billing (billingEnabled:false)
302  /dashboard /tracking /progress /coach /goals /programs/browse   (auth)
```

---

## NOT BUILT — the list other lanes should read first

**13 boards have no route or component.** Nine are another repo's.

*Amended 2026-11-06 (Igor's item 4): two of the thirteen were never screens.*
`LogoVariants` and `LogoShadow` are decision boards whose choices ship, so the
count of boards actually awaiting work is **eleven**, nine of them another
repo's — leaving `DeskToday`, `DeskActive`, `DeskArticles`, `DeskArticle` and
`Motion`, with `DeskCategory` deferred post-launch and `TypeCompare` never a
screen.

| board | lane | what is missing |
|---|---|---|
| **DeskToday** | C | no Nova side panel at desktop width |
| **DeskActive** | C | no rest side panel; `/tracking` is the phone layout widened |
| **DeskCategory** | A | the goal hub's three sections. `/programs/goal/[slug]` shipped today (#512) with the Programs section and the sibling cross-links; **Exercises and Articles cannot be served** — public exercises have `category: null` on every record and the blog answers `total: 0`. Two of three sections would render empty |
| **DeskArticles / DeskArticle** | A | `learn:false`; and no desktop layout even behind the flag |
| **Motion** | B | motion tokens exist in `main.css`; no board-level review |
| **TypeCompare** | — | a type comparison, not a screen. Nothing to build |
| ~~LogoShadow / LogoVariants~~ | A | **NOT HERE ANY MORE.** Both are choosers rather than screens, and both choices are implemented in `GmLogo.vue` + `gymmer.css` in **gymmer-ui**. The "PR 257 open" reference does not resolve — gymmer-ui has no #257. See "Next rows" for the evidence |
| **Watch×9** | Mobile | `gymmer-watch`, a separate package. gymmer-nuxt owns only the relay |

---

## Mobile — 39 boards

| board | status | route | lane | proving frame |
|---|---|---|---|---|
| Main | live + matches | `/` | A | `overnight/prod-board01-home-390-*` |
| Library | live + matches | `/library` | B | `prod-board02-library-390-*` |
| Muscle | live + matches | `/library/[facet]/[slug]` | B | `prod-board03-muscle-back-390-*` |
| Exercise | live + matches | `/exercises/[id]` | B | `prod-board04-exercise-top-390-*` |
| ExerciseScrolled | live + matches | `/exercises/[id]` | B | `prod-board05-exercise-scrolled-390-*` |
| ExerciseSheet | live + drift | `/exercises/[id]` (sheet) | B | `prod-b13-sheet-top-*`, `prod-b13-sheet-steps-*`. Drift: the clip uses iOS's native player (PR 225 open) |
| Gate | live, unverified | — (`BrowseGate`) | A | `b7-local/*` partial; no board diff |
| Dashboard | live + matches | `/dashboard` | B | `board-Dashboard-{dark,light}` |
| DashboardEmpty | live + matches | `/dashboard` first run | B | `board-DashboardEmpty-{dark,light}` |
| Programs | live, unverified | `/programs` | A | `programs-mine-390-*`; **re-diff needed — #512 changed this page today** |
| ProgramsLib | live, unverified | `/programs` facet grid | A | none. New today (#512) |
| Program | live, unverified | `/programs/[id]/details` | A | `program-detail-390-*` |
| ProgramPublic | live, unverified | `/programs/public/[id]` | A | `preview-390-*`; ungated today (#512), needs a guest diff |
| CreateProgram | live, unverified | `/programs/create` | A | `create-390-*` |
| AddExercise | live, unverified | `/tracking` | B | `add-exercise-pick-390-*`, `add-exercise-plan-390-*` |
| Train | live, unverified | — (`TrainSheet`) | B | `train-sheet-390-*` |
| Active | live, unverified | `/tracking` | B | `active-390-*` |
| ActiveHeader | live, unverified | `/tracking` | B | `workout-overflow-390-*`, `paused-390-*` |
| ActiveProgress | live, unverified | `/tracking` | B | `progress-strip-390-*` |
| BottomZone | live, unverified | `/tracking` | B | `metrics-filled-footer-390-*` |
| Cardio | live, unverified | `/tracking` | B | `cardio-390-*`, `cardio-running-390-*` |
| Rest | live, unverified | `/tracking` | B | `rest-390-*` |
| RestPicker | live, unverified | `/tracking` | B | `rest-picker-390-*` |
| SyncSheet | live, unverified | `/tracking` | B | `offline-details-390-*` |
| Summary | live + drift | `/tracking` complete | B | `summary-nohr-390-*`. Drift: sets grouping (warm-up W, best-set rule, single-set rows) still owed |
| History | live, unverified | `/history`, `/history/[id]` | B | `history-390-*`, `history-summary-390-*` |
| Progress | live, unverified | `/progress` | B | `progress-chest-390-*` |
| ProgressBests | live, unverified | `/progress` | B | `progress-bests-390-*` |
| BodyMap | live, unverified | `/progress` | B | `progress-{male,female,neutral}-{front,back}-390-*` |
| Coach | live, unverified | `/coach` | B | `coach-pro-390-*`, `coach-free-390-*` |
| Settings | live, unverified | `/preferences` | B | `after-preferences-*`, `settings-pro-390-*` |
| Pro | **built, flag-off** | — (`ProSheet`) | A | `billing-2026-11-03b/surface-sheet-*`, `surface-sheet-spent-*`. Shipped #502; `billingEnabled:false` keeps `/account/billing` a 404 and hides *See plans* |
| Articles | **built, flag-off** | `/articles` | A | `articles-guest-390-*`, `articles-app-390-*`. `learn:false` → 404 |
| Article | **built, flag-off** | `/articles/[slug]` | A | none |
| Theme | live, unverified | — (tokens) | B | `token-audit.md` |
| Motion | **not built** | — | B | none |
| TypeCompare | n/a | — | — | not a screen |
| LogoVariants | **decided — variant C** | — (`GmLogo`, gymmer-ui) | A | the board itself; `gymmer-g.svg` carries its `single` path. See "Next rows" |
| LogoShadow | **decided — A, no shadow** | — (`GmLogo`, gymmer-ui) | A | `gymmer.css:392-406`, "do not add one". See "Next rows" |

---

## Desktop — 10 boards · Lane C unless noted

| board | status | route | lane | proving frame |
|---|---|---|---|---|
| DeskHome | live, unverified | `/` | A | `b4-desk-home` |
| DeskLibrary | live, unverified | `/library` | C | `b4-desk-library` |
| DeskExercise | live + drift | `/exercises/[id]` | C | `b4-desk-exercise`, `exercise-panel-1300-*`. The adaptive panel landed today at 768 (#516); the page grid has not |
| DeskToday | **not built** | `/dashboard` | C | none |
| DeskActive | **not built** | `/tracking` | C | none |
| DeskPrograms | live, unverified | `/programs` | A | none. #512 built the facet grid and the guest shell; the desktop grid is unreviewed |
| DeskProgram | live, unverified | `/programs/public/[id]` | A | none |
| DeskCategory | **not built** (partial) | `/programs/goal/[slug]` | A | none. See the NOT BUILT table — two of three sections have no data |
| DeskArticles | **not built** | `/articles` | A | none; `learn:false` |
| DeskArticle | **not built** | `/articles/[slug]` | A | none; `learn:false` |

---

## Tablet — 4 boards · Lane C

| board | status | route | lane | proving frame |
|---|---|---|---|---|
| TabToday | live, unverified | `/dashboard` | C | `board-TabToday-{dark,light}`, `today-834-*` |
| TabLibrary | live, unverified | `/library` | C | none |
| TabExercise | live + drift | `/exercises/[id]` | C | `exercise-panel-1300-*`. The panel starts at 768 since #516; the board's 1024 column work is not done |
| TabActive | live, unverified | `/tracking` | C | none. Immersive mode hides the rail by design — the board still needs a ruling |

---

## watchOS — 9 boards · Mobile lane · other repo

`WatchIdle · WatchSet · WatchTimed · WatchRest · WatchList · WatchControls ·
WatchFinish · WatchSummary · WatchInfo`

All **other repo** (`gymmer-watch`). gymmer-nuxt owns the relay only. No frames
in `review/`; the watch board parity set is the mobile lane's
(`project_watch_board_parity`).

---

## Screens with no board

Carried forward from 2026-10-20 and still true, with two removals: `/goals`
**does** have frames (`b4-goals-empty`, `b4-goals-new`) though no `.dc.html`
board, and `/pricing` now has a reviewed set (`billing-2026-11-03b`).

- `/goals` — frames exist, **no board**. Lane A item 3 is "board → screens";
  there is no `Goals.dc.html` among the 62, so the board is either outside this
  directory or has not been drawn. **Needs Igor.**
- `/account/delete`, `/offline`, `/login`, `/auth/callback/apple`, `/try/[id]`,
  `/unsubscribe`, `/contact`, and the legal set (`/terms`, `/privacy`,
  `/imprint`, `/cookies`, `/ai-transparency`, `/accessibility`, `/about`)

## Needs backend before the board can ship

| board | what the API has to do |
|---|---|
| Pro | checkout + subscription state. gobackend **#226** (draft) has the public price list and `ended_at`; Stripe test mode needs keys and a webhook endpoint |
| Articles / Article / DeskArticles / DeskArticle | editorial content of type `blog`; the blog answers `total: 0` today |
| DeskCategory | public exercises carry `category: null` on every record, so the Exercises section cannot be filled |

## Next rows — every remaining "not built", with an owner

Igor's item 4, 2026-11-06. **DeskCategory is excluded by his ruling:
post-launch**, so it is not below.

Two of the nine dissolved on inspection and the evidence is in this section
rather than in a verdict word, because "not built" turned out to cover three
different things: a screen nobody has written, a screen blocked on data that
does not exist, and **a board that is not a screen at all** — a chooser whose
choice has already been made and shipped. The third kind cannot be built and
should never have been queued.

| board | owner | state |
|---|---|---|
| **DeskToday** | C | **not built.** No Nova side panel at desktop width |
| **DeskActive** | C | **not built.** No rest side panel; `/tracking` is the phone layout widened |
| **DeskArticles** | A | **not built, and triple-blocked** — see below |
| **DeskArticle** | A | **not built, and triple-blocked** — see below |
| **Motion** | B | **not built.** Motion tokens exist in `main.css`; no board-level review has happened |
| ~~LogoVariants~~ | A | **NOT A BUILD ROW — decided and shipped as variant C.** Evidence below |
| ~~LogoShadow~~ | A | **NOT A BUILD ROW — decided and shipped as A (no shadow).** Evidence below |
| TypeCompare | — | unchanged: a type comparison, not a screen. Nothing to build |
| Watch×9 | Mobile | unchanged: `gymmer-watch`, another repo. gymmer-nuxt owns the relay |

### The two logo boards are choosers, and both choices are in the shipped code

`LogoVariants.dc.html` offers **eight** candidate lockups, A–H, each a name and
a note — "Single G + YMMER", "Double G, inline — G at letter height", and so
on. It is a decision surface, the same kind as `TypeCompare`. Igor ruled on
2026-10-30 ("converge on the outlined wordmark everywhere"), and the shipped
component implements it.

**Which candidate shipped, measured rather than eyeballed:** the board builds
its rows from two path strings, `single` (`var S = 'M842.55 184.55 771.7
255.41 512 255.41Q459.78…'`) and `dbl` (`var D = 'M826 168 762 232H512C357.36…'`).
`app/assets/img/gymmer-g.svg` carries **`S`**, and its `viewBox` is
`144.57 144.59 737.94 734.81`, which is exactly the offset in `single.itf`'s
`translate(-144.57 -144.59)`. `GmLogo.vue` renders that file as the letter G
inside `gymmer-ymmer.svg`. So the shipped lockup is **variant C, "Single G,
inline — G at letter height, reads GYMMER"**, by identical path data.

`LogoShadow.dc.html` is titled *"Logo — G drop shadow comparison"* and offers
A (no shadow) through A5, with A3 already annotated **"Tried · not chosen"** on
the board itself. The answer is in `app/assets/css/gymmer.css:392-406`, in as
many words: *"Shadow variants A1-A4 were tried and rejected — do not add
one."* What shipped instead is the **A6 overshoot** — `height: 1.025em` on the
mark with `margin-bottom: -0.025em`, so the round G's top aligns with the
letters and it overshoots the baseline. No shadow anywhere in `.logo-wg-mark`.

So neither board is Lane A work. **Both reclassify to "decided",** which is a
status this file does not have and arguably should: a chooser is live the
moment its choice is implemented, and calling it "not built" invites someone to
build a second answer to a settled question.

Two stale references found while closing them, both the kind that survives
because nobody follows it:

- this file said LogoVariants was *"partly open as PR 257"*. **gymmer-ui has no
  #257**, and gymmer-nuxt#257 is *"feat(tracking): the G mark is the way out of
  a workout, not a chevron"* — merged, and about a different G.
- `GmLogo.vue` and `gymmer.css` both cite **"A6 (board 22b)"**. There is no
  `22b` among the 62 `.dc.html` boards, so the board that settled the shipped
  lockup is not in this directory. Worth finding before anyone revisits the
  overshoot, since it is the only record of why 2.5% rather than the 5% first
  tried.

- and this file said *"`GmLogo` exists"* without saying where. It is
  `app/components/GmLogo.vue` in **gymmer-ui**, not gymmer-nuxt — which is why
  both logo rows are this repo's work rather than the app's, and why a search
  in gymmer-nuxt finds nothing and reads as "not built".

### DeskArticles / DeskArticle are blocked three times over

Re-measured 2026-11-06, not carried forward:

| | measured |
|---|---|
| the flag | `learn:false` — `https://gymmer.com/articles` answers **404** |
| the content | `GET /api/v1/blog/posts?limit=1` → `{"items":[],"total":0,"pages":0}` |
| the layout | **zero responsive breakpoint prefixes** in `app/pages/articles/index.vue` or `app/pages/articles/[slug].vue` in gymmer-nuxt. The seven grep hits for `desk` in those files are all the word "desk" in prose comments, about the editorial desk |

The third is the only one Lane A can act on, and it is the one worth noting:
the mobile `Articles` / `Article` boards are **built, flag-off**, so the pages
exist and simply have no desktop treatment. That makes these two rows a
genuine build, not a wait — but a build nobody can review against a frame
until the flag opens and the desk publishes something, since a desktop article
layout with `total: 0` renders an empty state at 1280.

### What this leaves

| owner | rows |
|---|---|
| **C** | DeskToday, DeskActive — and both are **build specs, not drift reviews**. A board with nothing built cannot produce drift rows at all, which is a different kind of unknown from "no verdict yet" |
| **A** | DeskArticles, DeskArticle — buildable now, reviewable later |
| **B** | Motion — a board-level review that has never happened |
| **—** | TypeCompare, and the two logo boards once they are reclassified |

Lane A's own next step is the desktop layout for `/articles` and
`/articles/[slug]`, which is the only row on this list that is neither blocked
on a field, a flag, a ruling nor another repo.

---

## Counts

Counted from the three board tables above rather than carried forward, and
they reconcile to 62 both before and after Igor's item 4.

| | boards | was, 2026-11-04 |
|---|---|---|
| live + matches | 7 | 7 |
| live + drift | 4 | 4 |
| live, unverified | 30 | 30 |
| built, flag-off | 3 | 3 |
| **not built** | **5** | 7 |
| **decided** | **2** | — (counted as not built) |
| n/a | 2 | 2 |
| other repo | 9 | 9 |
| **total** | **62** | **62** |

The two that moved are `LogoVariants` and `LogoShadow`, which are choosers
rather than screens; `n/a` is `TypeCompare` and `DeskCategory` (deferred
post-launch, so not on the next-rows list).

**30 of 62 are "live, unverified"** — that number is the real state of the
review, and shrinking it is frame work rather than build work. **Five are
genuinely not built**, and that is the whole build queue: DeskToday and
DeskActive (C), DeskArticles and DeskArticle (A), Motion (B).

It said **28** until 2026-11-04, and the table always said 30. The count is the
thing that was wrong, and this file proves it against itself: the column has to
reach the 62 it claims on its own total line, and

    7 + 4 + 28 + 3 + 7 + 9 = 58   (+2 n/a = 60)
    7 + 4 + 30 + 3 + 7 + 9 = 60   (+2 n/a = 62)   <- the stated total

Counted the other way round, by reading the status cell of every data row in the
four board tables, the answer is 30 as well: 23 Mobile, 4 Desktop, 3 Tablet.

This matters beyond arithmetic, because the number is load-bearing: B17 is
scoped as "the 28 live, never verified boards", and a lane working from 28 would
have left two boards with no owner and no way to notice.

### The 30, by the lane column this file already carries

| lane | boards | which |
|---|---|---|
| **A** | 9 | Gate, Programs, ProgramsLib, Program, ProgramPublic, CreateProgram, DeskHome, DeskPrograms, DeskProgram |
| **B** | 17 | AddExercise, Train, Active, ActiveHeader, ActiveProgress, BottomZone, Cardio, Rest, RestPicker, SyncSheet, History, Progress, ProgressBests, BodyMap, Coach, Settings, Theme |
| **C** | 4 | DeskLibrary, TabToday, TabLibrary, TabActive |

Igor's B17 split — guest to A, in-app to B, tab/desk to C — agrees with this
column on B and C exactly. It does **not** agree on A, and he has now settled
which wins.

**Confirmed by Igor, 2026-11-04: "B17 split confirmed: guest to A, in-app to B,
tab/desk to C."** Applied to the two rows where the column and the rule disagree:
`CreateProgram` (`/programs/create`) and `Program` (`/programs/[id]/details`) are
signed-in screens, so **in-app sends them to B**. B17 ownership is therefore:

| | A | B | C |
|---|---|---|---|
| the lane column above | 9 | 17 | 4 |
| **B17, per the confirmed rule** | **7** | **19** | **4** |

The lane column itself is left exactly as it was. It is this file's record of
which lane owns a board's redesign work, which is not the same question as who
verifies it for B17, and changing it to match would overwrite one fact with
another. Where the two differ, B17 follows the rule and the column keeps its own
meaning. If that is backwards — if the column was meant to be the B17 split —
it is a one-line correction and the row names are all above.

### One prod frame proves no board

The production shoot writes six frames — `prod-board01-home` through
`prod-board05-exercise-scrolled`, and `prod-board07-login-prelaunch`. The first
five are cited above as proving frames. The sixth is cited by nothing, and
should stay that way: it photographs `/login`, which is listed under *Screens
with no board* below. There is one login-ish board in the canvas, `Gate`, and it
is the `BrowseGate` component rather than the login route. So the prod set
verifies five boards, not six, and `board07`'s name promises a board that does
not exist.
