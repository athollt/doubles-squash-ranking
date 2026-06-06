# Prototype: CI identity (step 13.2)

## Question
What is the BSC doubles squash ladder's visual identity — logo, colour palette, and
typography — for the PWA-first redesign? Explored from scratch (the step-13 baseline
was fully in play). Standalone mood-board, 5 complete identities, narrowed to a
day/night pair of the two finalists.

## Answer
**Court wins**, shipping **both day and night modes, with day as the default.**

Court read as the right fit: bold and sporty (it looks like a team kit), energetic
without being noisy, and its identity survives inversion cleanly. Neon was the runner-
up but is fundamentally a dark-mode personality — taming it for daylight (volt→olive,
aqua→teal) cost it the very thing that made it "Neon", so it didn't earn a both-modes
commitment. Court keeps its character in both modes because only the primary needed
shifting (royal→sky) for dark; the volt-lime accent is high-chroma enough to work on
either background.

### Typography
- **Headings**: `Archivo` (weight 900 for display, 700 elsewhere)
- **Body**: `Space Grotesk`
- Numerals are tabular throughout (the ladder is number-heavy — rank, rating, movement).

### Logo / mark
Riff on the existing racket + ball motif, simplified to a bold geometric mark: a
rounded-square badge in the primary, with the racket head (ellipse) + handle and a
solid ball in the volt accent. (Final SVG assets produced in 13.4.)

### Palette — Day (default)
| Token | Hex | Name |
|-------|-----|------|
| background | `#F4F6FB` | Mist |
| surface | `#FFFFFF` | — |
| foreground | `#0B1F3A` | Ink |
| muted | `#5B6B82` | — |
| line/border | `#E2E8F4` | — |
| primary | `#0B3D91` | Royal |
| primary-fg | `#FFFFFF` | — |
| accent | `#C6FF00` | Volt |
| accent-fg | `#0B1F3A` | Ink |
| win / up | `#138A36` | — |
| loss / down | `#D62246` | — |

### Palette — Night
| Token | Hex | Name |
|-------|-----|------|
| background | `#0A1426` | Navy |
| surface | `#102038` | Panel |
| foreground | `#EAF1FF` | — |
| muted | `#8FA4C4` | — |
| line/border | `#1E3253` | — |
| primary | `#4D8DFF` | Sky (royal brightened for dark) |
| primary-fg | `#06122A` | — |
| accent | `#C6FF00` | Volt (unchanged) |
| accent-fg | `#0B1F3A` | Ink |
| win / up | `#138A36` | — |
| loss / down | `#D62246` | — |

Radius token: `14px`.

## Decisions
- **Identity = Court; ships day + night; day is the default.** This supersedes the
  step-13 baseline CI (charcoal `#1A1A1A` + electric blue `#2D7FF9`, Geist fonts).
- **Both modes are first-class** — 13.4 defines theme tokens for both; the PWA should
  honour the system `prefers-color-scheme`, defaulting to day.
- Only the **primary** colour changes between modes (royal→sky); accent and
  win/loss stay constant. Keeps the two themes cohesive and the token set small.
- Feeds **step 13.3** (UX prototype renders in Court/day) and **step 13.4**
  (design-system tokens, fonts, and logo assets are built from this).

## Cleanup
Standalone prototype at `zTemp/ci-prototype/` (gitignored). Disposable — safe to
delete; this notes file is the only durable artifact.
