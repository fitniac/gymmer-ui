# Screen · Today (dashboard)

**Boards:** 09 Today · with history (tweak `plan`), 10 Today · first run, T1 Today, D4 Today · app
with Nova panel.

**Route & files:** `pages/dashboard.vue` (316 lines), `composables/useDashboard.ts`, `useProgress.ts`,
`components/dashboard/PhraseOfDay.vue`, `DemographicsPrompt.vue`, charts, new `NovaCard.vue`.

## Purpose
Answer "what do I do today?" in one glance and start it in one tap; show just enough progress to
motivate.

## Layout — phone, with history (09)
1. Top row: logo (wordmark-g) · avatar "IF" → settings.
2. Eyebrow date "FRIDAY · 2 OCT"; H1 "Hello, Igor." 32/800.
3. **Up next card** (`--gm-surface`, `--gm-radius-card`): label "UP NEXT · SESSION 3 OF 4 THIS WEEK",
   name 24/800, caption "4 exercises · 10 sets · ~45 min", muscle line, small `GmBodyMap` (front,
   ~90px) on the right; primary "Start workout" + secondary "Preview" (→ program detail).
4. **This week:** 7 day dots (M–S), trained days filled accent, today ringed; "2 of 4 sessions".
5. **Nova · before you train** (`NovaCard`): one actionable tip + chips "Why?" / "Make it lighter".
6. **Progress** section header + "See all" (→ `/progress`):
   - 3 `GmStat` tiles: SESSIONS · 30D, VOLUME · 30D (t), STREAK (wk).
   - Weekly volume bar chart (8 weeks), current week accent, value label "5.2 t this week". On Free,
     weeks older than 30 days render hatched with "Free keeps the last 30 days · Keep it all with
     Pro" under the chart (the only Pro line on this screen).
   - Muscle split: horizontal bars of sets per muscle (30 days) + one Nova sentence ("Legs are behind…").
   - Recent records: 2 rows, exercise · when · "62.5 kg × 10".
7. Tab bar.

## Layout — phone, first run (10)
Hello + motivational line · **Get set up** checklist card with 4-segment meter "2 / 4": Create your
account ✓ · Make your first program ✓ · Tell Nova your goal (→ coach) · Log your first workout (→ start)
· "READY WHEN YOU ARE" card with primary "Start first workout" · Nova intro card with goal chips
(Build muscle · Get stronger · Lose fat · Train consistently → coach with the goal prefilled) ·
Progress placeholder: dashed card with ghost bars and "Volume, records and your weekly streak appear
here after your first logged session."

## Tablet (T1)
Rail + two columns: left (hello, up next, this week, stats), right (Nova, weekly volume, muscle
split, records).

## Desktop (D4)
Header nav; left sidebar column with a Pro card ("Try Pro free for 7 days" — Free only); main column
as phone but stats in a 3-up row and charts side by side; "Recent sessions" table (name, date, time,
volume, PR badge) with "All history"; **right Nova panel** (persistent chat: tip, sample exchange,
quick actions "Make it 30 min" / "Plan my week", quota line on Free, composer).

## Data
Existing `useDashboard` (next session, week, stats, recent) + `useProgress` for charts. Body-map
levels from the next program's target muscles (same mapping as `ProgramThumb`). Nova tip: coach flow,
cached per day. Setup checklist: derived (has program, has goal, has session).

## Keep
`DemographicsPrompt` via `AppDock` (desktop/tablet); `PhraseOfDay` can move into the empty state or
be dropped — decide with Igor (open question).

## Acceptance
- [ ] Start workout from Today in one tap; Preview opens the program.
- [ ] Empty state shows instead of zeros for a new account.
- [ ] Free/Pro chart behaviour matches the plans doc; one Pro line max.
- [ ] Desktop Nova panel shares state with `/coach` (same thread).
