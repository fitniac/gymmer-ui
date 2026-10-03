# Screen · Settings (+ Appearance)

**Boards:** 19 Settings (interactive, tweak `plan`), 07 Appearance settings (interactive).

**Route & files:** `pages/preferences.vue` (777 — split into sections), `composables/usePreferences.ts`,
`useAppearance.ts`, `@gymmer/ui` `useTheme`, `useDeviceSettings.ts`, `components/tracking/DeviceSettingsModal.vue`.

## Settings (19)
Back "‹ Today" · H1 "Settings" · profile row (avatar, name, "Age, height, body-map figure" → profile
sub-page) · **plan card**: Free → "You're on Free" + "Try Pro free for 7 days" + benefits line +
primary (→ `ProSheet(trigger:'settings')`); Pro → "PRO · Trial · 5 days left · Manage" (store
management link) · **Training** rows (units, default rest, equipment, warm-up sets… — existing
preferences) · **App** rows: Appearance ("Dark · Ember" → 07), Language, Demonstrations ("Match my
profile") · **AI coach**: switch "Review my finished workouts", link "How the coach works", note text
(Free: "On Free, Nova reviews some workouts at random") · Sign out.

Rows: 52px, label left, value muted right, chevron; grouped in `--gm-surface` cards with uppercase
group labels. Switches: track `--gm-raised` → `--acc`, knob slides 250ms `--gm-ease-sheet`.

## Appearance (07)
Live **preview card** (a mini set card: "SET 2 / 4 · Bent Over Barbell Row · 8 reps · 60 kg ·
Complete set 2") that re-themes as the user picks · **Mode**: Light / Dark / System (radio
segmented) · **Accent**: swatches from the closed `ACCENTS` list (README D7) with names · note "Text on
your accent switches between dark and light automatically…" · **Corners**: Square / Soft / Round
(new `data-corners`, foundations §1). Changes apply instantly with a 350ms colour transition.

## Split plan for `preferences.vue`
`PrefsProfile.vue`, `PrefsPlan.vue`, `PrefsTraining.vue`, `PrefsApp.vue`, `PrefsCoach.vue`,
`AppearanceScreen` (own route `/preferences/appearance` so the back button works on phone).

## Acceptance
- [ ] Appearance persists locally (as today) and survives reload with no flash (SSR cookie + no-flash script).
- [ ] Corner preference changes radius app-wide without layout shift.
- [ ] Plan card matches the account's state; Manage opens the right store page on native.
