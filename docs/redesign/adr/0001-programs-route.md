# ADR 0001 — Where public programs live

Status: **accepted** 2026-10-03 by Igor (Phase 0.4)
Date: 2026-10-03 · Supersedes nothing · Affects D10, specs 09, 10, 18, 6.4

## The clash

`/programs` is taken. It is the signed-in list of *your own* programs
(`middleware: 'auth'`, `layout: 'app'`). D10 puts **public** programs in the guest
nav under Library, and Phase 5.3 gives them covers, phases and day cards — pages
that exist to be found by a search engine and read by someone with no account.

Two different pages want one URL, for two different audiences.

## What the routes actually look like today

The split is not by prefix, which is the thing to get right before adding to it:

| Route | Auth | Indexed |
|---|---|---|
| `/library` | public (`layout: false`) | yes, canonical + hreflang |
| `/library/[facet]/[slug]` | public | yes |
| `/exercises/[id]` | public | yes, in `/exercises/sitemap` |
| `/exercises` (index) | **authed** | no |
| `/programs`, `/programs/browse`, `/programs/public/[id]` | **authed** | no |

So the rule in force is *not* "`/library` is public and everything else is not".
It is: **detail pages and the library hub are public and indexed; list and
management pages are authed.** `/exercises` and `/exercises/[id]` already sit on
opposite sides of that line under one prefix.

## Options

**A — one `/programs` page with a Mine | Discover segmented control** (the
implementation plan's recommendation). One URL, one nav entry, the segment
remembers. Guests get Discover only.

**B — `/library/programs` for public, `/programs` stays Mine.** Public programs
join the library hub the guest nav already groups them under; the authed route
does not change its auth posture at all.

**C — `/programs` public, `/my/programs` authed.** Cleanest URL for SEO, but
moves a route people have bookmarked and that native builds deep-link into.

## Decision — B (accepted)

Accepted 2026-10-03 with four additions, folded into the shape below: goal hubs sit under
`/library/goals/[slug]`; `/programs/public/[id]` 301s to `/library/programs/[slug]`; the in-app
Programs tab gets a "Discover programs →" row rather than a Mine | Discover segment; and specs
09, 18 and 01-app-shell are updated to match.

Recommended against the plan's A, for one reason that outweighs the tidiness of a
single URL: **A makes one URL serve different content to a crawler and to a
user.** Googlebot is signed out, so it would index the Discover list under
`/programs` while every signed-in visitor sees Mine at the same address. That is
the shape that produces a page ranking for content the person who clicks never
sees, and it defeats route-level caching for the one page we most want cached.
The repo has already met this problem once and answered it the same way — that is
why `/library` exists as a separate public surface from `/exercises`.

B also costs the least: `/programs` keeps its middleware, its layout and its deep
links; nothing that exists today changes behaviour. A would turn an authed page
into a conditionally-authed one, which is a change to the most-linked route in
the app for a cosmetic gain.

### Shape

```
/library                      hub — Exercises · Programs · Goals      (public, exists)
/library/programs             public programs list                    (public, NEW, 6.4)
/library/programs/[slug]      public program detail                   (public, NEW, 6.4)
/library/[facet]/[slug]       muscle / equipment facet                (public, exists)
/library/goals/[slug]         goal hub — matches the Library strip     (public, NEW, 6.5)
/exercises/[slug]-[id]        exercise detail                         (public, exists)

/programs                     Mine — your programs                    (authed, exists)
/programs/create|[id]/…       authoring                               (authed, exists)
/exercises                    signed-in catalogue                     (authed, exists)
```

`/programs/browse` and `/programs/public/[id]` are then **redirects** into
`/library/programs*` once 6.4 ships — they are authed-only today, so no public
link rots.

### What this costs

Mine and Discover are two pages rather than one, so "find a program to start" is
one tap further from the signed-in list. Mitigated in spec 09 by a persistent
**"Discover programs →" row** at the top of `/programs` — accepted, and explicitly
**not** a segmented control: the segment would imply the two halves are the same kind
of thing, and they are not. One is yours and editable; the other is published and
copyable. A row also survives the empty state, where a segment with one populated
half reads as a bug.

## Naming: `/library` vs `/exercises`

Keep both; they are not duplicates. `/library` is the public, indexed browse
surface and the guest nav's hub. `/exercises` is the signed-in catalogue with
the user's own equipment ranking and the popup. Renaming either breaks live
URLs — `/library` is in the sitemap in 25 languages — for no user-visible gain.

## Consequences

- D10's Library group maps to real routes with no redirect at launch.
- Specs 09/10 keep `/programs` as Mine; spec 18 and PR 6.4 build under `/library/programs`.
- Sitemap, canonical and hreflang for public programs reuse `usePublicPageSeo`
  exactly as `/library` does — no new SEO machinery.
