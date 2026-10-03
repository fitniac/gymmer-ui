# Screen · Home (marketing, `/`)

**Boards:** 01 Home (phone), D1 Home · register & get the app (desktop, interactive slideshow).

**Route & files:** `pages/index.vue` (159, `layout: 'marketing'`), `components/marketing/*`
(`SiteNav`, `HeroSection`, `PhoneFlow`, `ExerciseTicker`, `LibrarySection`, `HowItWorksSection`,
`NativeAppsSection`, `WaitlistForm`, `FaqSection`, `PricingSection`, `NovaBand`, …).

## Purpose
Get the visitor to **register (or join the waitlist) and download the app**. Prove quality with the
product itself. **Do not promote prices or the paid plan** — the message is "Free forever, full
library".

## Section order — desktop (D1)
1. **Header**: logo · Exercise library · How it works · Apps · EN · Sign in · primary CTA.
2. **Hero** (faint radial gradients + masked diagonal hairlines): eyebrow "FREE FOREVER · FULL
   LIBRARY"; H1 "Train with a plan, not a guess." (Archivo 72/800, stretch 116); lede; primary CTA +
   secondary "Get the app"; trust line "No card · iPhone, Android & web · 25 languages". Right:
   `PhoneSlideshow` (Log a set · Rest · Results · Library; 3.6s auto-advance; tabs; pause on hover).
3. **Marquee** of exercise names (outlined/accent alternating) — `ExerciseTicker` restyled.
4. **Featured** "FEATURED THIS WEEK — Watch it. Then lift it." · `FeaturedExercises` 5 × 3:4 cards
   with autoplaying zoomed clips, hover lift · "All 412 exercises →" (→ library).
5. **A program for every goal** (new): eyebrow PROGRAMS, H2, goal chips → `/goals/[slug]`, four
   `ProgramCard`s, "All 31 programs →"; under a hairline, **From the articles**: three compact article
   links → `/articles`.
6. **How it works** (faint grid background): 01 Tell Nova your goal · 02 Get the program · 03 Train
   and log.
7. **Apps**: "Your gym bag needs one more thing." · Download for iPhone / Android · Open web app · QR
   "Scan to get the app". Official store badges once listings are live.
8. **Join**: "Free forever. Full library." · email + Create account · Continue with Google / Apple
   (existing `useSocialAuth`). Pre-launch: this is the waitlist form.
9. Footer (adds Exercises · Programs · Articles): About · Privacy · Terms · AI transparency · disclaimer.

## Phone (01)
Top: EN + "Sign up". Hero with the same eyebrow/H1 (46px)/lede, primary "Create free account", two
store buttons (Get it for iPhone / Android), trust line. "Watch it. Lift it." horizontal 3:4 carousel
(Ken Burns autoplay, "All 412"). Live product mock card (Triceps Dips set with steppers). Library
muscle tiles ("See all 412"). Nova italic quote band (Cormorant). Public bottom bar: Home · Library ·
Coach · Get app.

## Remove from Home
`PricingSection`, `OfferBar` (if it advertises price), any plan comparison. The body map is **not** on
Home (Igor). Keep `FaqSection` only if it does not talk about prices.

## SEO / performance
Hero H1 is real text; slideshow is decorative (`aria-hidden` on mock content, labelled controls);
videos lazy, poster first, `preload="none"` below the fold; LCP = H1 text. Organization +
SoftwareApplication JSON-LD.

## Acceptance
- [ ] No price or Pro mention above the footer.
- [ ] Primary CTA follows `usePrimaryCta` (waitlist pre-launch, signup after).
- [ ] Slideshow pauses on hover/focus and under reduced motion shows slide 1 static.
- [ ] Featured clips never autoplay with sound and stop when off-screen.
