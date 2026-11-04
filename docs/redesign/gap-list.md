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

| board | lane | what is missing |
|---|---|---|
| **DeskToday** | C | no Nova side panel at desktop width |
| **DeskActive** | C | no rest side panel; `/tracking` is the phone layout widened |
| **DeskCategory** | A | the goal hub's three sections. `/programs/goal/[slug]` shipped today (#512) with the Programs section and the sibling cross-links; **Exercises and Articles cannot be served** — public exercises have `category: null` on every record and the blog answers `total: 0`. Two of three sections would render empty |
| **DeskArticles / DeskArticle** | A | `learn:false`; and no desktop layout even behind the flag |
| **Motion** | B | motion tokens exist in `main.css`; no board-level review |
| **TypeCompare** | — | a type comparison, not a screen. Nothing to build |
| **LogoShadow / LogoVariants** | A | `GmLogo` exists; the variant set is not reviewed. `LogoVariants` partly open as PR 257 |
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
| LogoVariants | **not built** | — | A | PR 257 open |
| LogoShadow | **not built** | — | A | none |

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

## Counts

| | boards |
|---|---|
| live + matches | 7 |
| live + drift | 4 |
| live, unverified | 30 |
| built, flag-off | 3 |
| not built | 7 (+2 n/a) |
| other repo | 9 |
| **total** | **62** |

**30 of 62 are "live, unverified"** — that number is the real state of the
review, and shrinking it is frame work rather than build work.

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

Igor's B17 split — guest to A, in-app to B, tab/desk to C — is a restatement of
this column rather than a new division, and the two agree on B and C exactly.
**They do not quite agree on A**: `CreateProgram` and `Program`
(`/programs/[id]/details`) are signed-in screens sitting in lane A, so reading
"guest to A" literally would move them to B. The column is left as it is and the
disagreement recorded, because which it should be is Igor's call, not a lane's.

### One prod frame proves no board

The production shoot writes six frames — `prod-board01-home` through
`prod-board05-exercise-scrolled`, and `prod-board07-login-prelaunch`. The first
five are cited above as proving frames. The sixth is cited by nothing, and
should stay that way: it photographs `/login`, which is listed under *Screens
with no board* below. There is one login-ish board in the canvas, `Gate`, and it
is the `BrowseGate` component rather than the login route. So the prod set
verifies five boards, not six, and `board07`'s name promises a board that does
not exist.
