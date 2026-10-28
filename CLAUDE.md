# Mexico 2026: anniversary trip site

Handoff notes so a future session can pick this up cold.

- **Live site:** https://dvarano.github.io/mexico2026/
- **The app:** `index.html`, one self-contained file. No build step, no dependencies, no network
  calls except the self-update check (below).
- **Trip:** an anniversary trip for **Drew and Jen**, **Nov 2–14 2026**. Flying in Mon Nov 2 on **American
  AA1524 SBP 6:00 AM → PHX 8:55, AA501 PHX 11:42 AM → MEX 3:55 PM**. Mexico City (Andaz Condesa
  Nov 2–4, Kimpton Virgilio Polanco Nov 4–6) → San Miguel de Allende (NUMU Nov 6–10) → Cancún
  (Secrets Playa Blanca, Costa Mujeres, Nov 10–14; **Viva Aerobus VB 2061 QRO 8:00 AM → CUN 11:27 AM T2** on
  Nov 10, not the PDF's 6:00) → home Sat Nov 14 on **United UA1275, CUN 3:07 PM →
  San Luis Obispo (SBP) 7:58 PM** (from the user's United booking, Oct 15). The PDF said "12:07 PM CUN → LAX";
  12:07 PM Pacific is 3:07 PM in Cancún, so it was probably the same flight in home time. Corrected on
  the Today tab as a booking fact, like the Nov 6 car status. Flights come from the user's booking
  screenshots (Oct 15). **Never publish confirmation codes, seat numbers or surnames.** Booking facts
  go straight onto the Today tab; times that follow from them (Nov 2 evening, Nov 10 pickup) are
  flagged with a todo there and proposed on the Ideas tab until the user decides.
  **Sat Nov 7 is "Streetiversary"** (The Restaurant, 7:30 PM) and **Fri Nov 13 is "Anniversary"**
  (optional private dinner at Secrets). Renamed Oct 12 2026 at the user's request; set by each day's `badge`.
- **Source:** `Mexico_Anniversary_Itinerary_Latest_Oct12.pdf` (Drew, Oct 12 2026). Day pages were
  transcribed item by item, including its links; wording kept close to the PDF.
- **Branch:** commit and push directly to `main`. Pages serves `main`.
- **Separate from the golf site** (`dvarano/sandvalleyvatoz`). The update checker and the general
  shape were copied from it; nothing is shared at runtime.

## Editing the plan

Everything shown comes from the data blocks at the top of the script:

| Block | What |
|---|---|
| `DAYS` | one entry per day: `d` date, `city`, `stay`, `sub` summary, `items`, optional `note` / `todo` / `head` / `tz` / `badge` (pill on Today and Trip) |
| item fields | `t` time as shown, `at` 24h start `"HH:MM"` (drives Now/Next and the day switch; omit for vague times like "Morning"), `d` details, `walk` / `ride`, `ok` status, `res` name for Reservations, `todo` |
| `STAYS` | hotels: night ranges, `addr`, `cin` / `cout` times, `perks`, from the user's booking screenshots (Oct 15). Info lists them; Today's hero shows check-in/out times on move days. verify.js checks every night maps to the right hotel |
| `TRAVEL` | the Info tab's travel-days card, kept by hand |
| `RIDES` | Info's "Uber and getting around" tips (Oct 28 2026): Uber + DiDi (no Lyft; Cabify left 2024), Uber Comfort for long rides or bags, ride safety, MEX airport pickup zones vs authorized taxis, SMA taxis, Cancún transfers. Facts go stale: recheck before the trip |
| `SHOP` / `SHOP_NOTE` | the shopping list (`on` = days you're near the shop, as chips) |
| `IDEAS` | changes being considered, **not in the plan**. A card with `day` renders under **Day by day** (date block, city colour, sorted); cards without go under **Other ideas** (numbered, shaded). Options can carry `rows` (`[time, text]` pairs) for a revised schedule. When one is decided, move it into `DAYS` and delete it from `IDEAS` |

**Rule (Oct 15 2026): never change `DAYS` (the Today tab) for a suggestion until the user says it's
decided** (they discuss changes with their wife first). New suggestions go on the Ideas tab, **grouped
by day**: a day being reworked gets its own card at the top (the first is "Tuesday, Nov 3: a lighter
day"). The renames in the Trip line above were direct requests, not ideas.

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
**Nov 10 uses `tz:-6`** because its fixed times (5:00 AM pickup, 8:00 AM flight) are San Miguel /
Querétaro time; its note says Cancún is an hour ahead.

`liveDay(now)`: a day becomes Today at **3 AM local**, so a late dinner still shows that night.
A day whose first `at` is before 5:00 takes over at **8 PM the evening before**. No day does now:
Nov 10's pickup moved from 2:30 to 5:00 (Oct 15), so it opens at 3 AM and the evening of the 9th
previews it in the Tomorrow card.
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
public page). The booking screenshots also showed confirmation numbers, a World of Hyatt number, home
address, phone, email, card digits and prices: **none of it goes on the site.** Hotel addresses,
check-in/out times, room type and perks are fine.

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

- [ ] BajíoGo pickup Nov 10 at ~5:00 AM (decided Oct 15, for the 8:00 VB 2061): book it, shared or private.
- [ ] Resort → CUN transfer Nov 14: book it and set the time.
- [ ] CUN → Secrets transfer Nov 10 (arrival 11:27 AM): book it too; todo on the day (Oct 28). Round trip with Nov 14.
- [ ] Lucha Libre tickets Nov 3: not marked as bought.
- [ ] Bekeb cocktail class Nov 7: decide / book.
- [ ] Kan Bei Nov 7: waiting; The Restaurant stays unless they switch.
- [ ] Private anniversary dinner at Secrets Nov 13: ask the concierge.
- [x] Nov 2 evening (decided Oct 15, now on Today): land 3:55, Andaz ~5:00, Centro ~6:30 (drop at
      Bellas Artes if needed, walk Madero), Zócalo ~7:15–8:15, walk ~8:15, **Taverna 9:00 PM** (final, per
      the user Oct 28: the 8:30 OpenTable email Jen forwarded was outdated). Backup thresholds moved to ~6:45.
      Taverna is at General Prim 34, Colonia Juárez. The Zócalo's Ofrenda Monumental (32 m Posada catrina)
      runs Oct 29–Nov 2, 2026, so Nov 2 is its last night; Today's note says so. **Monday Ideas card**
      (Oct 28): backup if late: by ~6:15 plan as is; later, dinner first then the Zócalo ~10:15; too
      late, stay local (neighbourhood ofrendas, Open House Día de Muertos if its dates fit).
      **Now on Today (Oct 28):** Uber ~6:30 to Bellas Artes (Av. Juárez side); if traffic is bad, the Torre
      Latinoamericana corner or the south option (Izazaga at 20 de Noviembre, walk up 20 de Noviembre);
      Madero to the Zócalo 7:15–8:15; walk to Taverna via Madero, the Alameda and Bucareli for 9:00.
      The Monday Ideas card is back to just the late-arrival backup.
      After Taverna (user, Oct 28): Uber back recommended; walking (~40 min, ~3 km) listed as an option via
      Bucareli → Av. Chapultepec → Glorieta de Insurgentes → Insurgentes Sur (the Andaz is in the I421 /
      Conjunto Aristos complex at Insurgentes and Aguascalientes).
      Amsterdam / Parque México moved to Tuesday's breakfast loop. Monday's Ideas card is gone.
- [ ] Private car Kimpton → NUMU Nov 6, **10:30 AM** (moved from 8:30 by the user, Oct 15, to line up
      with NUMU's 3:00 check-in; slow Kimpton breakfast first): **not booked**. Shown as a todo on the
      day and in Info. The user also still needs to book the Nov 10 NUMU → QRO transfer (BajíoGo item).
- [x] Teotihuacan transport Nov 4 (decided Oct 15, on Today): **Uber out at 6:30** (schedule it the night
      before; todo), **back by bus** from the main gate to Terminal Norte then Uber to Condesa, with checking
      Uber at the site first as an option. No private driver. The Ideas transport option is gone; the
      midday shower idea now assumes the bus (back ~12:30).
- [x] Tuesday Nov 3 (decided Oct 15, now on Today): breakfast 8:00 (Saint / Odette / the Andaz) and
      the Parque México + Amsterdam loop; Uber ~9:15 to Templo Mayor; audio walk east to west to MUNAL;
      **Museo de Arte Popular and La Ciudadela are Optional ("depending on mood")**; Jen's solo
      Biblioteca Vasconcelos at 7:45 is an Optional item; Botánico as the main meal; Roma shops; rest;
      Uber 6:15 to the arena; optional Carmelita; Lucha 7:30; Orinoco after. **3:00–5:00 is a split**
      (Jen: Roma shops; Drew: La Roma audio walk, MODO or MUJAM; meet at Casa Bosques ~4:45), added
      Oct 15. The audio-tours card is gone, and the Tuesday Ideas card was removed
      entirely (Oct 15). The Friday card too: its breakfast and later departure are in the plan.
- [x] Thursday Nov 5 (decided Oct 15, now on Today): Kimpton breakfast 7:15; Uber 8:00 to the Ángel and
      walk the alebrijes to the Estela de Luz; castle at 9:00; Anthropology with the gallery order;
      **lunch keeps both options (El Turix or Sala Gastronómica)**; Masaryk shopping 2:00–4:00;
      **Museo Soumaya Optional after the shopping (~4:00–5:00)**, per the user, instead of the split;
      rest and pack 5:00–7:00; Jacinta 7:30. **Parker & Lenox removed (Oct 15): after dinner the user only
      wants options within walking distance, no Uber.** The Thursday Ideas card now holds just that
      (a nightcap at Limantour Polanco, Oscar Wilde; no walkable live jazz found).
- [ ] Ideas to discuss. (History) **Tuesday Nov 3 card** (Oct 15): evening with Botánico as the main meal,
      no 5:30 dinner, snack at the arena, Orinoco after the show (the user's #1); morning audio walk
      through Centro east to west, dropping Biblioteca Vasconcelos (variation: Jen does the
      library solo at 7:45 and they meet at Templo Mayor ~9:45); split at La Ciudadela (Biblioteca
      de México / Mercado de San Juan). It replaced the old "swap an upscale dinner" idea.
      **Wednesday Nov 4 card** (Oct 15): driver drops at the Andaz ~12:15 to shower and check out
      before Maizajo (which is in Condesa, Fernando Montes de Oca 113); Teotihuacan status after the
      April 2026 shooting; arrive at Rosetta ~30 min early to try for an earlier seat (the user
      chose this over requesting an 8:00 reservation); split in Polanco (Jen dropped at the shops on the ~3:00
      Uber, Drew checks in with the bags). It replaced the old
      "driver carries the bags" idea. **Thursday Nov 5 card** (Oct 15): El Turix lunch; afternoon
      split (Jen on Masaryk, Drew to Soumaya/Jumex or the pool) instead of the Soumaya zigzag;
      Anthropology galleries (Teotihuacan, Mexica, Maya); pack before Jacinta; optional Parker &
      Lenox. The Thursday items moved here from the theme cards.
      **Colorful museums** (Oct 15; the user isn't keen on Diego Rivera): Tuesday adds the Museo de Arte
      Popular instead of MUNAL and an afternoon split (Jen in the Roma shops; Drew at MODO or MUJAM, the
      toy museum by the arena); Thursday adds a morning walk past the monumental alebrijes on Reforma
      (Ángel → Estela de Luz, on display until Nov 8 2026). **Hotel breakfast** (Oct 15): **confirmed** from the
      bookings: the Andaz and the Kimpton (both The Edit) include daily breakfast for two and a $100
      credit; the Andaz adds early/late checkout when available, the Kimpton a guaranteed 4 PM late
      checkout. NUMU (points stay) shows no breakfast; Secrets is all-inclusive. Tue/Thu/Fri carry a hotel-breakfast alternative;
      Wed suggests asking the Andaz for breakfast to go (6:30 pickup). **Friday Nov 6 card** exists for
      that only. Monday Nov 2's card was adopted into the plan
      (Oct 15) and removed, with the Condesa audio walk that no longer fits Monday. Still open
      from Oct 12: El Turix / seafood lunch, audio tours, splitting up for shopping, optional jazz +
      simpler connections.
