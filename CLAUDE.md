# Mexico 2026: anniversary trip site

Handoff notes so a future session can pick this up cold.

- **Live site:** https://dvarano.github.io/mexico2026/
- **The app:** `index.html`, one self-contained file. No build step, no dependencies, no network
  calls except the self-update check (below).
- **Trip:** an anniversary trip for two, **Nov 2–14 2026**. Mexico City (Andaz Condesa
  Nov 2–4, Kimpton Virgilio Polanco Nov 4–6) → San Miguel de Allende (NUMU Nov 6–10) → Cancún
  (Secrets Playa Blanca, Costa Mujeres, Nov 10–14) → home CUN → LAX 12:07 PM Nov 14.
  **Anniversary day is Sat Nov 7** (The Restaurant, 7:30 PM).
- **Source:** `Mexico_Anniversary_Itinerary_Latest_Oct12.pdf` (Drew, Oct 12 2026). Day pages were
  transcribed item by item, including its links; wording kept close to the PDF.
- **Branch:** commit and push directly to `main`. Pages serves `main`.
- **Separate from the golf site** (`dvarano/sandvalleyvatoz`). The update checker and the general
  shape were copied from it; nothing is shared at runtime.

## Editing the plan

Everything shown comes from the data blocks at the top of the script:

| Block | What |
|---|---|
| `DAYS` | one entry per day: `d` date, `city`, `stay`, `sub` summary, `items`, optional `note` / `todo` / `head` / `tz` / `anniv` |
| item fields | `t` time as shown, `at` 24h start `"HH:MM"` (drives Now/Next and the day switch; omit for vague times like "Morning"), `d` details, `walk` / `ride`, `ok` status, `res` name for Reservations, `todo` |
| `STAYS` | hotels with night ranges; verify.js checks every night maps to the right hotel |
| `TRAVEL` | the Info tab's travel-days card, kept by hand |
| `SHOP` / `SHOP_NOTE` | the shopping list (`on` = days you're near the shop, as chips) |
| `IDEAS` | changes being considered, **not in the plan**. When one is decided, move it into `DAYS` and delete it from `IDEAS` |

Markup inside text: `[text](url)`, `[text](map:Google Maps query)` and `**bold**`. Bold must not
span a link (`**Pre-book** [BajíoGo](…) **pickup**`, not `**Pre-book [BajíoGo](…) pickup**`).
`ok` is one of `Confirmed`, `Reserved`, `Booked`, `Optional` (`Suggested` is for Ideas only).
Reservations and the Info → Still to sort list are **built from the items**, so a new `res` or
`todo` shows up there without touching Info.

**Bump `SITE_UPDATED`** (UTC, top of the script) in every commit that changes what the site shows.
It drives "Updated X ago". Not for tests or docs.

## Time zones and which day it opens on

Mexico City and San Miguel are **UTC−6 all year**; Cancún (Quintana Roo) is **UTC−5 all year**.
Neither observes DST (Mexico dropped it in 2022). Each city carries its `tz`; a day can override it.
**Nov 10 uses `tz:-6`** because its fixed times (2:30 AM pickup, 6:00 AM flight) are San Miguel /
Querétaro time; its note says Cancún is an hour ahead.

`liveDay(now)`: a day becomes Today at **3 AM local**, so a late dinner still shows that night.
A day whose first `at` is before 5:00 (only Nov 10) takes over at **8 PM the evening before**.
Before the trip and after it, the site opens on the Trip tab; during it, on Today. Now/Next tags
appear only on the live day. An open page that comes back to the foreground rolls on to the new
day if it was showing the old one. All pinned in verify.js §2–§3.

## Code updates reach open phones

Same as the golf site: `checkForUpdate()` fetches `location.pathname?cb=<now>` with `no-store`,
hashes the inline script and compares it with the running `BUILD`; on a mismatch it
`location.replace`s onto `?v=<build>`. Loop guard: if `?v=` already names the fresh build it never
redirects again. Runs at boot, on returning to the tab and on bfcache restore, throttled to 30s.
Only on http(s), so the file:// test path skips it. **The script must stay the first `<script>`.**

## Privacy

The repo and site are **public** (free GitHub Pages needs a public repo). `noindex` keeps it out of
search engines, but anyone with the link can read it. **Never add confirmation numbers, phone
numbers, passport details or door codes.** The shopping list names Maddie (her surprises are on a
public page).

## Testing

```
npm i playwright && node verify.js        # SHOTS=1 also writes screenshots to ./shots/
```

Drives the real `index.html` from disk at 390px: data integrity (dates, `at` format and order,
statuses, links, hotel nights, chip days), the landing day across all the switch points, Now/Next,
every tab and every day in light and dark with no horizontal overflow or page errors, navigation
(Trip rows, Ideas chips, next-day, Back to today), the Info lists, and shopping ticks surviving a
reload. If Chromium isn't on the default path, set `executablePath` in `chromium.launch()`.

## Open items (from the PDF)

- [ ] BajíoGo 2:30 AM pickup Nov 10: confirm the shared shuttle runs that early; compare private.
- [ ] Resort → CUN transfer Nov 14: book it and set the time.
- [ ] Lucha Libre tickets Nov 3: not marked as bought.
- [ ] Bekeb cocktail class Nov 7: decide / book.
- [ ] Kan Bei Nov 7: waiting; The Restaurant stays unless they switch.
- [ ] Private anniversary dinner at Secrets Nov 13: ask the concierge.
- [ ] Flight in to Mexico City Nov 2: details not in the PDF.
- [ ] The five Ideas areas (Oct 12, to discuss): casual dinner swap, El Turix / seafood lunch,
      audio tours, splitting up for shopping, optional jazz + simpler connections.
