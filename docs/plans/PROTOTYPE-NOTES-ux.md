# Prototype: UX direction — ladder & submit (step 13.3)

## Question
What does the app feel like as a mobile/PWA experience (not a web page), for the two
first-class phone journeys — the **public ladder** and the **scorer's submit** — and
what's the right structure/interaction model for each? In-app prototype, rendered in
the chosen Court/day CI, gated by `?variant=`, writes stubbed.

## Answer

### Ladder — dense table won
A **dense table** beat the podium-list and feed-card takes: it's the most scannable for
a number-heavy ranking and closest to how members already read a ladder. Columns
(final terms): **# · Player · Score · Played · Trend**.
- **Score** displays the **`ladderScore`** (rounded) — the number players are actually
  ranked by, so the value never contradicts the rank order. (We explicitly chose this
  over showing the raw `currentRating`.)
- **Played** = `sessionsLast90Days` — the activity/turnout signal, shown as a plain count.
- **Trend** = ▲/▼ rank change.
- The **New** badge flags provisional players.
- A maskable point: the original variants used `var(--font-sans)`, which rendered in
  the app's old Geist font — the prototype had to load **Archivo + Space Grotesk**
  (Court) explicitly before the look could be judged. (Lesson for 13.4: the design
  system must wire the Court fonts into `app/layout.tsx`, not assume them.)

### Submit — chip picker + segmented wins won
The decisive correction: the data model is **flat — 4–8 individual players, each with a
wins count; there are no teams** (the engine infers doubles pairings statistically). An
early "team vs team" variant misrepresented this and was discarded. Of the flat-capture
variants, the winner pairs:
- **Tap-to-pick chip player picker** (pills, "+ New" inline) — no native `<select>`,
  thumb-friendly, fast courtside.
- **Segmented 0–7 wins buttons** — tap the number, no keyboard.
- Slots 1–4 by default, "+ Add player" up to 8.
- Per-player count is labelled **"wins"** (not "games won").

### App chrome
Bottom **tab bar** (Ladder · Sessions · ＋ · Trends · Submit) with a raised accent FAB
read as the right "installed app" navigation model. Sticky top bar with the mark +
wordmark. This is the nav model for 13.4 to build properly.

## Decisions (locked for 13.4 / 13.5)
- **Ladder** = dense table, columns **# · Player · Score · Played · Trend**, **New**
  badge. Score = rounded `ladderScore`.
- **Submit** = flat all-players capture (no teams), **chip player picker + segmented
  wins buttons**, slots 4→8, label "wins", button "Log tonight's results".
- **Navigation** = bottom tab bar + FAB; sticky top bar.
- **CI** = Court/day (per `PROTOTYPE-NOTES-ci.md`); the design system must load
  Archivo + Space Grotesk in the root layout.
- **Terminology** = locked and pinned in `CONTEXT-redesign.md` → "User-facing glossary"
  (Score, Played, Trend, New, Session [internal] / warm submit button, Wins). Internal/
  DB names unchanged.

## Cleanup
In-app prototype (sub-shape A): `app/_prototype/` + the `?variant=` gate blocks in
`app/page.tsx` and `app/submit/page.tsx`. **Deleted** once these notes were captured —
this file and `CONTEXT-redesign.md` are the durable artifacts. The winning approach is
re-implemented properly (with tests) in 13.5, on the 13.4 design system.
