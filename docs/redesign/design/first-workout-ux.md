# First-workout UX: specs and rulings (2026-10-18)

From Igor's first real workout (Leg day, iPhone Chrome, RU UI). One section per item.
Type is marked: **SPEC** (new UI to build), **RULING** (decision only, no new screen) or **ENG** (engineering fix, no design).

Rules for all items:
- Workouts are offline-first. Every action below writes locally (a journal op) and syncs later. Nothing waits on the network mid-workout.
- Phone first (375–430 px), touch targets ≥ 44 px, button labels never ellipsised or shrunk. Labels must fit in RU and DE at 320 px. If a label doesn't fit, shorten the copy or give the button its own full-width row.
- No explanatory sentences. Short labels; facts, not instructions.
- New i18n keys only. Never edit a shipped default. EN is given; RU only where the wording is tricky.
- Reduced motion: every animation below has a static equivalent.

## Priority

| # | Item | Type | Why this position |
|---|---|---|---|
| 1 | 7 · Edit a confirmed set | SPEC (+ stability op) | Wrong numbers are the worst data bug a member can see |
| 2 | 1 · Finish adding exercises | SPEC | Blocks building a programme |
| 3 | 5 · Next-step cue | SPEC | Small, high value every workout |
| 4 | 6 · Reopen a finished exercise | SPEC | Same row/sheet pattern as 7 |
| 5 | 8 · Time since last set | SPEC | Tiny |
| 6 | 9 · Frozen timer after app switch | ENG (+ fallback) | Trust in the timer |
| 7 | 4 · Inline "✓ Added" | SPEC | Ships with 1 |
| 8 | 3 · Compact muscle filters | SPEC | Ships with 1 |
| 9 | 2 · Suggestions from programme context | SPEC (+ stability ranking) | Needs backend |
| 10 | 11 · Get set up rows | RULING (+ goal sheet) | Onboarding |
| 11 | 12 · Free after a workout | RULING | Already mostly shipped |
| 12 | 13 · Page transition | RULING | Confirm the fix |
| 13 | 10 · Sync during region outage | SPEC (wording) | Rare; copy only |

Suggested PR grouping: (7 + 6) · (1 + 4 + 3) · (5 + 8) · 9 · 2 · (11 + 12) · 10. Item 13 needs no PR.

---

## A. Add-exercise flow (Programme builder → Add exercise)

### 1. Finish action. SPEC
- **Adding is immediate.** Each "+ Add" adds the exercise to the programme at once (local op). There is no "save" step to lose.
- **Sticky footer:** one full-width primary on GmSheetShell's safe-area footer.
  - With 0 added: **"Done"**.
  - With n added: **"Done · n"**.
- **✕ in the header** = the same as Done. It never discards anything.
- **After Done:** back to the programme page.
  - Scroll to the first exercise added in this visit.
  - The added rows get the brief accent (the same highlight Nova uses for new programmes, ~1.2 s, then normal). Reduced motion: a static accent outline for 2 s.
- **States:**
  - Offline: works the same (ops queued); no indicator beyond the app's sync dot.
  - Error on the local write: impossible in normal use. If it happens, the "+" doesn't flip, and nothing else changes.
- **Keys:** `exercises.picker.done` "Done" (RU "Готово"), `exercises.picker.doneCount` "Done · {n}" (RU "Готово · {n}").

### 4. "Exercise added" toast → inline state. SPEC (ships with 1)
- No toast. The card's add button flips: **"+ Add" → "✓ Added"** (accent-soft fill, same 44 px size).
- **Tapping "✓ Added" removes it again**, so undo is free and there's no extra control.
- The footer count updates live.
- Screen reader: the button is a toggle, `aria-pressed`, label "Add {name}".
- **Keys:** `exercises.picker.added` "Added" (RU "Добавлено"). Reuse the existing "Add" key.

### 3. Compact muscle filters. SPEC (ships with 1)
- **Replace the chip block with ONE horizontally scrolling row, 44 px high:**
  `[ Filters · n ]  Legs  Back  Chest  Shoulders  Arms  Core  Cardio`
  - **"Filters · n"** comes first and opens a GmSheetShell sheet with:
    - detailed muscles (adductors, neck, …), grouped under the same 7 areas;
    - equipment;
    - "With video".
    - The badge n counts the active sheet filters, and is hidden when 0.
  - **Area chips are single-select;** tap again to clear. There is no "Any muscle" chip: no selection means all.
  - The search field stays above the row.
- The list starts directly under the row, so the first exercise is visible above the fold at 375×667.
- Selecting a detailed muscle in the sheet highlights its area chip.
- **Keys** (`exercises.area.*`):
  - `legs` "Legs" / "Ноги"
  - `back` "Back" / "Спина"
  - `chest` "Chest" / "Грудь"
  - `shoulders` "Shoulders" / "Плечи"
  - `arms` "Arms" / "Руки"
  - `core` "Core" / "Кор"
  - `cardio` "Cardio" / "Кардио"
  - `exercises.filters.count` "Filters · {n}"
- **Mapping muscle → area** lives in one shared table, server-side if stability already groups muscles; otherwise client-side constants.

### 2. Suggestions from programme context. SPEC (+ stability ranking)
- **A section above "All exercises":** heading **"For {programme name}"** (RU «Для «{name}»»; the name is ellipsised as content text if long).
  - Up to 6 rows, the same row component as the list.
  - Then the heading "All exercises" and the normal list.
- **Ranking inputs** (stability implements):
  - the programme name (semantic search);
  - the muscles of the exercises already in the programme (same body area first);
  - the member's equipment (must fit);
  - excludes exercises already in the programme;
  - for a strength-named programme (e.g. "Leg day"), cardio ranks below strength.
- **No per-row dismiss.** Adding an item removes it from the section; the next suggestion slides in.
- The section hides while a search query or any filter is active, because the user has taken control.
- **States:**
  - loading: 3 skeleton rows, the heading visible;
  - offline or error: section hidden, "All exercises" from cache;
  - no usable signal (default name like "Program 1" and no exercises yet): section hidden;
  - empty result: section hidden.
- **API (stability):** `GET /exercises/suggest?program_id=…&limit=6`, returning catalogue rows in the list's shape plus `reason` (internal, not shown).
- **Keys:** `exercises.picker.suggestedFor` "For {name}", `exercises.picker.all` "All exercises".

## B. Live workout

### 7. Edit a confirmed set. SPEC (+ stability: journal op)
- **Entry:** tap any completed set row (in the exercise view, the list of done sets). There is no separate edit icon.
- **Editor:** a GmSheetShell sheet titled with the exercise name and "Set {n}".
  - The same inputs as logging, pre-filled, by measurement:
    - weight + reps;
    - reps only;
    - duration (mm:ss);
    - duration + distance (cardio);
    - assisted / added load, in the tracker's existing convention.
  - **Scope**, shown only when the workout came from a programme AND this set maps to a programme set:
    - a GmSegmented touch control: **"Today" · "Today + program"**, default **Today**;
    - the same component and wording pattern as the rest picker's scope.
  - **Footer:** primary **"Save"**.
  - Below it, a text button **"Delete set"** (destructive colour), on its own row.
- **After Save:**
  - The sheet closes and the row updates in place.
  - One snackbar: **"Set updated · Undo"** (5 s). Undo restores the previous values, and the programme too if that scope was chosen.
  - Delete uses the same snackbar: "Set deleted · Undo".
- **Recompute on save:** volume, best set and the PR flags for this workout recompute locally on save. The Summary reflects the edit.
- **Offline:** a `set_edit` / `set_delete` journal op, plus a `program_set_edit` op when the programme scope is chosen. **Stability:** confirm these ops exist or add them, with idempotent replay.
- **Edge cases:**
  - editing a set of a finished workout from History / Summary: same sheet, scope "Today" only, i.e. that workout;
  - the edit makes a PR stop being a PR: the PR tag disappears; no message.
- **Keys:** `tracking.editSet.title` "Set {n}", `tracking.editSet.scopeToday` "Today" (RU "Сегодня"), `tracking.editSet.scopeProgram` "Today + program" (RU "Сегодня + программа"; check it fits 320 px in DE, otherwise "+ program"), `tracking.editSet.save` "Save", `tracking.editSet.delete` "Delete set", `tracking.editSet.updated` "Set updated", `tracking.editSet.deleted` "Set deleted", `common.undo` "Undo" (reuse if it exists).

### 6. Reopen a finished exercise. SPEC (with 7)
- **Finished rows stay tappable** in the workout list and open the exercise as usual. They keep ✓ and "3 sets".
- **Strength:** the exercise view shows the done sets (tappable for 7), then **"+ Add set"** (the same control as during the exercise). Adding a set makes the exercise active again: ✓ removed until that set completes.
- **Cardio:** the exercise view shows the logged entry (duration · distance) and a primary **"Resume"**.
  - The timer continues from the logged duration; finishing updates the same entry. No second entry.
  - "+ Add interval" is out of scope.
- **Ordering:** reopening doesn't move the row.
- **Keys:** reuse "Add set". New `tracking.resume` "Resume" (RU "Продолжить"), only if no shipped key fits.

### 5. Next-step cue. SPEC
- **Trigger:** the last set of an exercise is completed.
- **Rest bar / rest sheet:** a line under the timer, **"Next · {exercise name}"** (name ellipsised as content). Tapping it opens that exercise.
- **When rest ends or is skipped and the list is visible:**
  - auto-scroll the next unfinished exercise into view (smooth, ≤ 300 ms);
  - its row/ring gets **one** accent pulse (2 cycles, ~1.2 s total).
- **Reduced motion:** an instant scroll plus a static accent outline for 2 s.
- **No sound.** On native, one light haptic on rest end, if the haptic setting is on.
- If every exercise is done: "Next" is replaced by the existing finish cue. No new UI.
- **Keys:** `tracking.nextUp` "Next · {name}" (RU "Далее · {name}").

### 8. Time since last set. SPEC
- **When:** from the moment rest ends or is skipped until the next set is completed.
- **What:** a small mono chip in the active exercise header, clock icon + **"2:14"**, counting up, muted colour.
- It is hidden while the rest timer runs (the rest timer is the clock then).
- **Screen reader:** `aria-label` "Since last set: 2 minutes 14 seconds", announced only on focus, never live.
- **Computed from timestamps** (last completed set time), never from an incrementing counter, so it survives app switches (see 9).
- **Keys:** `tracking.sinceLastSet` "Since last set" (aria only).

### 9. Frozen timer after switching apps. ENG first; fallback SPEC
- **Engineering fix (do this):**
  - All workout timers derive their value from wall-clock timestamps.
  - On `visibilitychange` (visible), `pageshow` and `focus`, recompute immediately and force a render (`requestAnimationFrame`).
  - Don't wait for the next interval tick.
  - Add an e2e that hides/shows the page and asserts the displayed value matches the elapsed time within 1 s.
- **Fallback, only if a real-device test still shows a stale frame after the fix:** on resume, the timer digits fade in (opacity 0 → 1, 150 ms) with the recomputed value, so a stale frame never reads as live.
- **No "Welcome back" screen:** it adds a tap in the middle of a workout.

### 10. Sync during a home-region outage. SPEC (wording only)
- **Never mention "region" to members.** Members never wait: every workout action completes locally.
- **The sync dot's detail sheet, while waiting:** **"Saved on this phone"** + a muted "Syncing" with a spinner. RU: «Сохранено на телефоне» / «Синхронизация».
- **Finish workout:**
  - finishes locally at once; the Summary is computed locally;
  - the Summary shows the same sync dot in its header until synced;
  - the Nova review (Pro) appears when the server has the session.
  - No blocking message and no "We'll finish it…" text: the finish already happened from the member's point of view.
- **Server-dependent actions mid-outage** (e.g. "Ask Nova", "Build with Nova"): the existing error state ("Couldn't build it" + "Try again"). No new copy.
- **Keys:** `sync.savedOnDevice` "Saved on this phone", `sync.syncing` "Syncing" (reuse if they exist).

## C. Today and after the workout

### 11. "Get set up" rows. RULING (+ one small sheet)
Igor wants every row tappable.
- **All rows are tappable, with a chevron.**
  - Done rows show ✓ and muted text, **no strike-through** (it reads as disabled).
  - The section disappears once all rows are done (existing behaviour, if so).
- **Destinations:**
  - **Create your account:** pending → sign-up; done → Settings (profile).
  - **Log your first workout:** pending → **the Train sheet** (Up next · Other program · Empty workout), not Programs. Done → History.
  - **Build a program:** pending → New program; done → Programs.
  - **Tell Nova your goal:** pending and done → **a goal sheet** (new, small).
    - GmSheetShell with the same goal grid as the Nova builder (Muscle / Strength / Fat loss / Fitness) and "Days per week" 2–6;
    - primary "Save";
    - saved to the profile; Nova and the Nova builder pre-fill from it;
    - opening it again shows the current values.
- **Keys:** `today.setup.goalTitle` "Your goal", reuse the goal and days keys from the Nova builder, and `common.save`.

### 12. Free members after a workout. RULING
- **One line, never a card.** Keep the shipped group-3 pattern.
- **Web:**
  - trial unused: **"Every workout reviewed · Try Pro free"** → the Pro sheet;
  - trial used and no billing yet: **show nothing**.
- **Native:** show nothing (no purchase path in the apps).
- At most one upsell line on the Summary. No upsell inside the workout itself.
- **Keys:** reuse `complete.reviewedEvery`; new `complete.tryProFree` "Try Pro free" only if the existing "Try Pro" is replaced on this surface.

### 13. Page transition. RULING
- **Confirmed:** on phones, the leaving page doesn't animate; only the arriving page slides in (0.18 s).
- Navigation never waits for an animation to finish.
- Reduced motion: no slide (instant).
- Desktop/tablet: no slide (fade ≤ 120 ms or none).
- Keep the e2e that caught the black screen as a guard.

---

## Stability work these items need
1. Item 7: `set_edit`, `set_delete` and `program_set_edit` journal ops (idempotent replay), with server-side recompute of volume/PRs on replay.
2. Item 2: `GET /exercises/suggest?program_id&limit` (ranking as above).
3. Item 3: the muscle → area grouping, if not already on the facets API.
4. Item 11: the goal and days/week fields on the profile, if not already there (the Nova builder may already store them).
