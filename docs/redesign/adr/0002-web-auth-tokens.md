# ADR 0002 — Where web auth tokens live

Status: **accepted** 2026-10-04 by Igor · **launch blocker** (Phase 7)
Date: 2026-10-04 · Supersedes nothing · Affects `useApi`, `useSecureStore`,
`stores/auth`, the login module in gobackend

## The problem

On web, both tokens are in `localStorage`:

| Token | Today, on web | Lifetime |
|---|---|---|
| access (`gm.access_token`) | `localStorage` **and** the `gm_at` cookie | minutes |
| refresh (`gm.refresh_token`) | `localStorage` | days |

`useSecureStore` on web is `localStorage` (it swaps to `@capacitor/preferences`
on native, which is why it is called secure). `useApi` writes both tokens there
on login, and `gm_at` additionally goes into a cookie so SSR can read it.

Any script that runs on the page can read both. The access token is the smaller
half of that: it expires. **The refresh token is the one that mints new
sessions**, and it sits in the same readable store with a lifetime measured in
days. One XSS anywhere on gymmer.com — a dependency, a stray `v-html`, an
injected analytics snippet — takes an account for as long as the refresh token
lives, and takes it silently.

Making the `gm_at` cookie `HttpOnly` would change nothing while this is true,
which is the trap in the obvious framing: the cookie flag is not where this is
decided.

## Decision

**Web**

- **Access token in memory only.** A module-scoped ref, never written to
  `localStorage` and never to a cookie. It dies with the tab, which is correct:
  it is re-minted in milliseconds from the refresh cookie.
- **Refresh token in a server-set cookie**: `HttpOnly`, `Secure`,
  `SameSite=Lax`, and **`Path=/api/v1/login/refresh`** so it is not sent with
  any other request on the site. JS cannot read it; XSS cannot exfiltrate it.
- **Rotated on every use, with reuse detection.** Each refresh issues a new
  refresh token and invalidates the old one. A second use of an already-spent
  token means the token was copied, so the whole family is revoked and every
  session on that device chain ends. This is the part that turns theft from
  permanent into a single-use window.
- **Silent refresh on load.** The app has no access token at boot, so it calls
  refresh before its first authed request. A failure is an ordinary signed-out
  state, not an error.
- **Logout clears server-side.** `POST /login/revoke` kills the family and the
  response clears the cookie; a client that only forgets its own copy leaves a
  live credential on the server.

`SameSite=Lax` rather than `Strict`: the refresh path is reached by the app's
own fetch, and `Strict` breaks the case where a user lands on an authed route
from an external link — exactly the share links Phase 6 adds.

**Native does not use cookies, and its store needs replacing too.**

Verified on the iOS simulator rather than assumed: under `capacitor://localhost`
there is **no cookie store at all** — `Library/Cookies/` is empty and there is
no cookie database anywhere in `WebKit/WebsiteData`. So a cookie design cannot
reach native even if we wanted it to, and `useApi` branching on platform is not
a preference but a requirement.

**An earlier draft of this ADR said `@capacitor/preferences` is "backed by the
Keychain and Android Keystore". That is wrong.** It is `UserDefaults` on iOS
and `SharedPreferences` on Android — Capacitor's own documentation says it is
not secure storage. The simulator confirms it: both tokens sit in plaintext in
`com.gymmer.app.plist` as `CapacitorStorage.gm.access_token` and
`CapacitorStorage.gm.refresh_token`, in a file that is included in device
backups.

So the refresh token is readable on native by anything that can read the app
container or an unencrypted backup. That is a different exposure from the web's
— it needs device or backup access rather than an XSS — but it is the same
credential with the same lifetime, and it belongs in the same piece of work.

## Native storage: a real secure store

**The pick: `@aparajita/capacitor-secure-storage`.**

Why that one over the alternatives:

- It wraps the **iOS Keychain** with the accessibility class exposed, so the
  refresh token can be stored `…ThisDeviceOnly` — which is what keeps it out
  of iCloud and iTunes backups. A plugin that does not expose accessibility
  cannot make that promise.
- On **Android** it uses a Keystore-backed key over EncryptedSharedPreferences,
  so the key material never leaves the hardware-backed store on devices that
  have one.
- Its API is close enough to `@capacitor/preferences` that the native branch of
  `useSecureStore` is a near drop-in — one interface, two implementations, which
  is what that composable already is.

**Confirm Capacitor 8 support before committing to it.** This project is on
Capacitor 8 and the plugin's published peer range needs checking; if it has not
caught up, the shortlist is `capacitor-secure-storage-plugin` (older, wider
compatibility, no accessibility control) or a thin in-repo plugin over Keychain
and Keystore directly — which this repo already has the shape for, since
`GymmerShellPlugin` is exactly that.

**What moves, and what does not.** The refresh token goes to the secure store.
The access token stays in memory on native too, for the same reason it does on
web: it is re-minted in milliseconds and a copy at rest is a copy to steal.

**Migration, first launch, no forced logout.** On boot the native client reads
the refresh token from `Preferences`; if one is there, it writes it to the
secure store, confirms the write by reading it back, and only then deletes the
`Preferences` copy. A failure at any step leaves the old copy alone and retries
next launch — losing a session to a migration is worse than a week of
plaintext.

## gobackend endpoint changes

The login routes come from the framework's login module
(`/api/v1/login/*`). What this needs:

| Endpoint | Change |
|---|---|
| `POST /login/login`, `/login/oauth`, `/login/social`, `/login/claim/{email}`, `/login/magic/{email}`, `/login/totp` | On success, **set the refresh cookie** (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/v1/login/refresh`, `Max-Age` = refresh TTL) and return the access token in the body as now. Stop returning `refresh_token` in the body **for web callers**; native still needs it. |
| `POST /login/refresh` | Read the refresh token from the **cookie** when the body has none. Rotate: issue a new refresh token, set the new cookie, invalidate the old. Return the new access token. **POST only** — see below. |
| `POST /login/revoke` | Revoke the family and clear the cookie (`Max-Age=0`). |
| — | **Token families + reuse detection**: store an id per issued refresh token with a family id and a used flag; a second presentation of a used token revokes the family. |

**How a caller says which it is: `Origin`, and nothing else.**

Native must keep getting `refresh_token` in the body. The decision of who may
receive one is made from the request's `Origin` header, and **never** from a
custom header such as `X-Client: native`.

A custom header is forgeable *by the very attacker this ADR exists to stop*.
Script running on the web origin can set any header it likes on its own fetch,
so `X-Client: native` would let an XSS ask for the refresh token in the response
body — pulling the credential straight back into JS and defeating the entire
design. The browser sets `Origin` and script cannot override it; that is the
whole reason it is trustworthy.

The rule, failing closed:

| Request `Origin` | Refresh token in the body? |
|---|---|
| `https://gymmer.com` and any other web origin | **never** — cookie only, whatever other headers say |
| `capacitor://localhost` (iOS) | yes |
| `http://localhost` (Android WebView) | yes |
| absent (a native HTTP client, a server-to-server call) | yes |
| anything else | **no** |

**`/login/refresh` must be POST-only, and that is load-bearing.**

The "absent `Origin` → native, give it a body token" rule rests entirely on
browsers always sending `Origin` on this request. They do for POST, and for any
cross-origin fetch. They do **not** for a top-level GET navigation — so if
refresh ever answered a GET, pointing a browser at
`https://api.gymmer.com/api/v1/login/refresh` would arrive with no `Origin`,
be read as a native client, and hand the refresh token back in a response body
the page could then read. The method restriction is not tidiness; it is the
thing that keeps the Origin rule sound.

The server rejects every other method with 405, and that has a test of its own
rather than being left to a router default — a framework that quietly answers
HEAD or OPTIONS the same way would reopen it.

**CSRF, while we are here.** The refresh cookie is `SameSite=Lax`, which means
the browser does not attach it to a cross-site POST at all; a form on another
site submitting to the refresh endpoint carries no cookie and gets nothing. Lax
*does* attach cookies to top-level GET navigations — which is the second reason
POST-only matters, and why the two are one story and not two.

Two consequences worth stating. An `Origin`-less request is treated as native,
because a plain HTTP client sends none and a browser always does — so the
absence is itself evidence. And `http://localhost` is on the native list, which
means a developer running the web app locally also gets a body token; that is
the same origin the Android WebView uses and they cannot be told apart, so the
exposure is a local dev machine, which is acceptable where production is not.

## Migration for already-logged-in users

**No forced logout**, and it is avoidable:

1. Ship the backend first. `/login/refresh` accepts the refresh token from the
   body **or** the cookie, and always responds with the new cookie. Old clients
   keep working unchanged.
2. Ship the web client. On boot, if `localStorage` holds a refresh token, it
   calls `/login/refresh` with it **once**, gets a rotated token in the cookie,
   and then **deletes both tokens from `localStorage`**. The user stays signed
   in and the readable copy is gone within one page load.
3. After one release cycle, drop the body-accepting branch for web origins. By
   then every live web session has migrated or expired.

The one case that cannot be saved is a client whose refresh token has already
expired — that is an ordinary re-login, and it would have happened anyway.

## Later, maybe: `androidScheme: 'https'`

Android's WebView currently serves `http://localhost`, which is why it is on
the native list and why a `Secure` cookie is dropped there. Capacitor can serve
`https://localhost` instead (`androidScheme: 'https'`), and that would be
better in two ways at once: the origin stops colliding with a developer running
the web app on `http://localhost`, so the native exception narrows to something
that cannot be a browser; and `Secure` cookies start working in the WebView, so
Android could use the same refresh-cookie design as the web instead of a second
path.

**It is blocked on data, not on configuration.** Changing the scheme changes the
origin, and every origin-scoped store goes with it. `localStorage` and
IndexedDB under `http://localhost` are simply not visible from
`https://localhost`: on the first launch after the switch the user is **logged
out**, and — worse — the workout journal and the outbox are empty. Sets logged
in a basement and not yet synced would be gone, silently, which is the single
most alarming thing this app can do.

So: only behind a migration that runs on the old origin first, reads the
journal, the outbox and the tokens, and hands them across — and only once that
migration has been proven on a device with pending writes. **Not now**, and not
as part of 7.6.

## The backend sanitises on save, too

`ContentPage` and the `about`/`contact` fragments sanitise the CMS HTML on
render (`sanitizeCms`, allowlist + DOMPurify). That is the layer that protects
today's readers, and it is the right place for it — but it is the *last* layer.
Admin-api should sanitise the same HTML **on save**, so a payload never reaches
the database at all and every other consumer of that content — an email, an
export, a future native renderer — is covered without each one remembering.

Routed to the gobackend session with the same allowlist:
`a br em h1 h2 h3 li ol p strong ul`, attribute `href`, schemes `http`,
`https`, `mailto`, `tel` and relative.

## Consequences

- An XSS can still use the access token **while the page is open**. That is the
  residual risk and it is bounded by the token's own TTL; it cannot be carried
  away.
- SSR loses the ability to read an access token from a cookie, so a
  server-rendered authed route must either render a shell and hydrate, or the
  SSR guard moves to the refresh cookie's presence. Worth settling when the
  client half is built — `middleware: 'auth'` currently reads `gm_at`.
- A tab that has been open past the access token's TTL refreshes on its next
  request, which already happens today.
- `gm_at` as a cookie goes away entirely, which also removes the host/Secure
  decision ADR-adjacent work in `cookieShouldBeSecure` — that function exists
  only to serve this cookie.
