# Mobile-First Redesign — Context

Covers the PWA-first redesign of the doubles squash ladder: UX (navigation/structure)
and Design/CI (look-and-feel), prototyped before any shared-component refactor.

## Language

**PWA-first**:
The installed Progressive Web App on a phone home screen is the primary experience to
design for. The browser website is back-ported from the winning PWA design, not the
other way round.
_Avoid_: responsive web, mobile site

**Redesign**:
Both UX (navigation model, screen structure, interaction flow) AND Design/CI
(visual identity, palette, components) — not a reskin of the existing layout.

**Design-system foundation**:
A shared set of UI primitives (page shell, card, badge, nav chrome) plus a
"reuse before you build" rule, established *before* feature pages are written.
Its absence is the root cause of the current cross-screen inconsistency.

**Scorer-submission journey**:
A scorer entering session results on a phone, courtside, right after play. One of two
first-class phone journeys (the other is public ladder viewing). The make-or-break
interaction for the SCORER role.
