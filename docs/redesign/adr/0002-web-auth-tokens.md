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

**Native keeps the secure store.** A Capacitor build has no SSR and no
cross-site surface, `@capacitor/preferences` is backed by the Keychain and
Android Keystore, and a WebView under `capacitor://localhost` cannot rely on a
cookie at all. `useSecureStore` stays the native path; the two diverge
deliberately and `useApi` already branches on platform.

## gobackend endpoint changes

The login routes come from the framework's login module
(`/api/v1/login/*`). What this needs:

| Endpoint | Change |
|---|---|
| `POST /login/login`, `/login/oauth`, `/login/social`, `/login/claim/{email}`, `/login/magic/{email}`, `/login/totp` | On success, **set the refresh cookie** (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/v1/login/refresh`, `Max-Age` = refresh TTL) and return the access token in the body as now. Stop returning `refresh_token` in the body **for web callers**; native still needs it. |
| `POST /login/refresh` | Read the refresh token from the **cookie** when the body has none. Rotate: issue a new refresh token, set the new cookie, invalidate the old. Return the new access token. |
| `POST /login/revoke` | Revoke the family and clear the cookie (`Max-Age=0`). |
| — | **Token families + reuse detection**: store an id per issued refresh token with a family id and a used flag; a second presentation of a used token revokes the family. |

**How a caller says which it is.** Native must keep getting
`refresh_token` in the body. Options, for the gobackend session to settle: a
`X-Client: native` header, a scope on the token request, or inferring from the
`Origin` (`capacitor://localhost` / `http://localhost`). The header is the least
magical and the easiest to test.

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
