# Screen · New program

**Board:** 13 New program (interactive).

**Route & files:** `pages/programs/create.vue` (156), `programs/PublicProgramBrowser.vue`,
coach flow for generation (new).

## Layout — phone
Top bar: "Cancel" (`--acc-deep`) · "New program" · empty. `GmSegmented` modes:
**With Nova** · **Template** · **Blank**. Sticky glass footer with one primary whose label follows the
mode: "Build my 3-day program" / "Browse published plans" / "Create and add exercises".

- **With Nova:** intro row (sparkle avatar + "Four answers and Nova writes the whole week…"); Goal
  (2×2 option buttons: Build muscle · Get stronger · Lose fat · Stay consistent); Days per week
  (2–6); Time per session (30/45/60/75 min); Equipment row "Full gym · from your preferences ·
  Change" (→ preferences equipment). Selected option = 2px accent border + `--acc-soft` fill.
- **Template:** search field + `PublicProgramBrowser` list (name, level, days/week, muscles) → preview →
  "Copy to my programs".
- **Blank:** Name, Description (optional) fields; note "Next you'll pick exercises from the library —
  the ones your equipment allows come first." → create then open program detail with the add sheet.

## Data / backend
Nova generation is **new backend work** (coach flow returning a program draft). Until it exists,
hide the With Nova segment behind a feature flag and default to Template.

## Acceptance
- [ ] Program limit enforced in all three modes (existing 403 path).
- [ ] Nova mode returns a draft the user lands on in program detail, editable.
