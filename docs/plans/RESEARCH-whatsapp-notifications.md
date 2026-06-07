# Research: WhatsApp session-result notifications

**Status**: open — not started
**Origin**: testing-feedback round (post step 14.4 live deploy)

---

## Question

When a session is added, can results be posted to WhatsApp **cheaply** — without
paying for a WhatsApp Business API account or a per-message platform fee?

## Why this is a research task, not a build step

The cost/effort/ToS trade-offs are unknown, and the cheapest viable option dictates
the implementation entirely (an official Cloud API integration looks nothing like a
share-link or a self-hosted bridge). No code should be planned until a direction is
chosen. This doc is the placeholder for that research.

## To investigate (when picked up)

Run the `/research` skill against this question. Candidate directions to compare on
**cost, setup effort, reliability, and Terms-of-Service risk**:

- **WhatsApp Cloud API (official)** — free tier / conversation-based pricing; what
  the actual cost is at this club's volume (a handful of sessions/week).
- **Click-to-share / `wa.me` link** — generate a pre-filled message the scorer taps
  to post into the club group manually. Zero cost, zero infra, but manual.
- **Unofficial bridges** (e.g. self-hosted WhatsApp-Web automation) — cheapest in
  fees but explicitly against WhatsApp ToS and account-ban risk; document the risk.
- **Sidestep WhatsApp** — a shareable result link / existing PWA share sheet, if
  the real need is just "broadcast the result somewhere".

Deliverable: a recommendation with the cost and ToS implications spelled out, then
(if approved) a build step folded into a future plan round.
