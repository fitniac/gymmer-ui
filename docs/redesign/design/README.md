# Design snapshot

Snapshot of the "GYMMER redesign" Design canvas (claude.ai, version 1791016142-7fe6, 2026-10-03).
The canvas is the live source; refresh this folder when it changes.

- `canvas.json` — board list, titles, positions and pages (Mobile / Desktop / Tablet).
- `*.dc.html` — one artboard each. They render only inside the canvas runtime (`support.js` is not
  included), so read them as markup reference: exact sizes, spacing, copy, states, and the
  `renderVals()` logic of interactive boards. Each board's `theme()` builds the mockup CSS vars; map
  them to layer tokens with `../00-foundations.md` §1.

## Boards

| Page | File | Board | Spec |
|---|---|---|---|
| Mobile | Main | 01 Home | screens/17-home |
| Mobile | Library | 02 Library | screens/12-library |
| Mobile | Muscle | 03 Muscle · Back | screens/12-library |
| Mobile | Exercise | 04 Exercise · top | screens/13-exercise-page |
| Mobile | ExerciseScrolled | 05 Exercise · scrolled | screens/13-exercise-page |
| Mobile | Gate | 06 Soft gate | screens/13-exercise-page |
| Mobile | Theme | 07 Appearance settings | screens/15-settings |
| Mobile | Motion | 08 Motion & theme tokens | 00-foundations |
| Mobile | Dashboard | 09 Today · with history | screens/07-today |
| Mobile | DashboardEmpty | 10 Today · first run | screens/07-today |
| Mobile | Programs | 11 Programs | screens/09-programs |
| Mobile | Program | 12 Program · Chest Day | screens/10-program-detail |
| Mobile | CreateProgram | 13 New program | screens/11-create-program |
| Mobile | Train | 14 Start a workout (sheet) | screens/06-start-workout |
| Mobile | Active | 15 Active · strength + rest | screens/03-active-workout |
| Mobile | ExerciseSheet | 15b Exercise sheet | screens/02-exercise-sheet |
| Mobile | Cardio | 16 Active · timed cardio | screens/03-active-workout |
| Mobile | Summary | 17 Workout complete | screens/05-workout-complete |
| Mobile | Coach | 18 Coach · Nova | screens/14-coach |
| Mobile | Settings | 19 Settings | screens/15-settings |
| Mobile | Rest | 20 Rest timer | screens/04-rest |
| Mobile | Pro | 21 Pro · 7-day trial | screens/16-pro |
| Mobile | LogoVariants | 22 Header logo variants (A chosen) | 00-foundations §6 |
| Mobile | Progress | 23 Progress · body map | screens/08-progress |
| Mobile | BodyMap | Component · body map (stand-in) | 01-components |
| Mobile | TypeCompare | Type comparison (B chosen) | 00-foundations §3 |
| Desktop | DeskHome | D1 Home | screens/17-home |
| Desktop | DeskLibrary | D2 Library | screens/12-library |
| Desktop | DeskExercise | D3 Exercise page | screens/13-exercise-page |
| Desktop | DeskToday | D4 Today + Nova panel | screens/07-today |
| Desktop | DeskActive | D5 Active workout | screens/03-active-workout |
| Tablet | TabToday | T1 Today | screens/07-today |
| Tablet | TabLibrary | T2 Library | screens/12-library |
| Tablet | TabExercise | T3 Exercise | screens/13-exercise-page |
| Tablet | TabActive | T4 Active workout | screens/03-active-workout |
| Mobile | ProgramsLib | 24 Programs · discover by goal | screens/18-content-model |
| Mobile | ProgramPublic | 25 Program · public detail | screens/18-content-model |
| Mobile | Articles | 26 Articles | screens/18-content-model |
| Mobile | Article | 27 Article · widgets | screens/18-content-model |
| Desktop | DeskPrograms | D6 Programs | screens/18-content-model |
| Desktop | DeskProgram | D7 Program · public detail | screens/18-content-model |
| Desktop | DeskCategory | D8 Goal (category) hub | screens/18-content-model |
| Desktop | DeskArticles | D9 Articles | screens/18-content-model |
| Desktop | DeskArticle | D10 Article · widgets | screens/18-content-model |

## Decision log (from the design review with Igor)

1. Mobile-first, native-feeling, SEO-safe; accent is user-configurable from a closed list.
2. Primary button glow removed → thin ring around the centre Train button.
3. Exercise media 3:4; muscle and equipment media 1:1.
4. Pro promoted gently: history forever, Nova on every workout, unlimited programs, 7-day free trial.
   Free: 3 programs, 30-day history, Nova sometimes.
5. Ads for Free only, in the rest timer and timed cardio.
6. Rest timer = big ring with ±15s, last-set editor for every measured field, "Save to program".
7. Dashboard and workout-complete carry charts.
8. Logo: wordmark with the single-ring G (variant A), G aligned to the YMMER baseline.
9. Desktop and tablet versions added; home rebuilt around register + download, slideshow hero,
   featured autoplay 3:4 clips, subtle radial/diagonal backgrounds, no prices, no body map on home.
10. Body map on programs, workout results and progress (real admin artwork in code).
11. Type: Archivo headlines + Google Sans Flex for body, captions and labels (Plex Mono dropped).
12. Tab bar: small G on Today, barbell icon on the centre Train button.
13. Desktop library added; browse by muscle **and** by equipment, both with images.
14. Bigger exercise thumbs in lists and the workout; tapping a thumb opens the exercise sheet with
    video, instructions and same-muscle swaps (add/replace in program).
15. New entities: Goal (category, many-to-many on programs, exercises and articles), public programs
    library ("a program for every goal"), and articles with program / workout / exercise widgets that
    add to a program or start. Public nav: Exercises · Programs · Articles.
16. Header logo: G gets a 0.5px optical overshoot below the YMMER baseline (A6); no drop shadow.
