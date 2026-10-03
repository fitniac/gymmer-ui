# Screen · Pro sheet (7-day trial)

**Board:** 21 Pro · 7-day free trial (tweak `trigger` changes the headline).

**Route & files:** new `components/plans/ProSheet.vue`, refactor `programs/ProgramLimitUpsell.vue`,
`pages/pricing.vue` (public page — keep, restyle with the same content), `usePremium.ts`, analytics.

## Layout (bottom sheet; desktop centred dialog 480px)
1. "PRO" label + **headline by trigger**: history → "Keep every workout, forever."; program_limit →
   "You've built 3 programs."; coach → "Ask Nova anything, any time."; rest_ad → "Rest without ads.";
   settings/default → "Train with everything unlocked."
2. Sub: "Try everything in Pro free for 7 days. Keep Free afterwards if it isn't for you."
3. **Comparison table** (3 columns: feature · FREE · PRO): History 30 days / Forever · Nova some
   workouts / Every workout · Programs 3 / Unlimited · Ads Rest & cardio / None. Pro column in ink,
   Free muted.
4. **Plan picker**: Yearly (badge "Best value", per-month equivalent) / Monthly — prices from the store
   SDK, never hard-coded.
5. **Trial timeline**: Today — all of Pro unlocks, no charge · Day 5 — we remind you · Day 7 — billing
   line ("€X/year starts. Cancel any time before.").
6. Primary "Start 7-day free trial" · text "Not now" · legal links.

## Program limit variant
Keep `ProgramLimitUpsell`'s honesty: add a secondary "Delete a program instead" row that goes to the
programs list in select mode.

## Acceptance
- [ ] Every Pro touchpoint opens this sheet with its trigger; analytics events fire.
- [ ] Prices render from the store (native) / checkout config (web); no literals.
- [ ] Not shown at all to Pro accounts or during a trial (Settings shows "Manage" instead).
