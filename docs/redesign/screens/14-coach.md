# Screen · Coach (Nova)

**Board:** 18 Coach · Nova (tweak `plan`); right panel on D4.

**Route & files:** `pages/coach.vue` (151), `components/coach/CoachBubble.vue`, `CoachPapers.vue`,
`CoachLauncher.vue`, `composables/useCoachChat.ts` (SSE), `useCoachActions.ts`.

## Layout — phone
1. Glass header: accent sparkle avatar 40px · "Nova" 18/800 · "Knows your programs and history" ·
   history button (past conversations).
2. Messages: user bubbles right (`--gm-raised`, 18/18/4/18 radius); Nova messages left as plain text
   (no bubble) with **action cards** inline (e.g. program card: name, "~45 MIN", plan line, Start /
   Adjust buttons; exercise mentions render `ExerciseThumb sm expandable`). Typing indicator = 3
   bouncing dots. Messages rise in 350ms.
3. Composer block above the tab bar: Free quota line (`ProNudge`: ●●○ "2 questions left this week ·
   Ask any time with Pro"), suggestion chips (Swap an exercise · Why this weight? · Plan my week),
   textarea pill + round accent send button, disclaimer "General fitness guidance, not medical advice."

## Behaviour that must survive
SSE streaming, `CoachPapers` citations, coach actions (read page / act on program), launcher in
`AppDock` (now hidden on phone — see shell spec).

## Data
Quota is new backend data (plans doc O1). Until available, omit the dots.

## Acceptance
- [ ] Streaming renders token by token without layout jumps.
- [ ] Action cards perform their action and confirm with a toast.
- [ ] Quota line only for Free; zero quota disables send with the Pro link, never hides history.
