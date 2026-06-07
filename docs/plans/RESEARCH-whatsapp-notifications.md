# Research: WhatsApp session-result notifications

**Date**: 2026-06-07
**Status**: complete
**Origin**: testing-feedback round (post step 14.4 live deploy)

**Question**: When a session is added, can results be posted to the club's WhatsApp
**group** cheaply — without paying for a WhatsApp Business API account or a per-message
platform fee?

**Verdict**: **No cheap *automated* post-to-group path exists.** Every option that posts
*into a WhatsApp group* programmatically is either impossible (official API) or a ToS
violation with account-ban risk (unofficial bridges). The only zero-cost, zero-risk,
ToS-clean path is a **tap-to-share** flow: the app builds the result message, the scorer
taps once, and the OS/WhatsApp share sheet posts it into the group. Recommendation: build
the share-sheet flow; do **not** integrate the Business/Cloud API or a self-hosted bridge.

---

## Why the goal ("post to the group") constrains everything

The real need from testing feedback is *"results land in the club WhatsApp group after a
session."* That is a **group** target, not a 1:1 message to a known number. This single
fact eliminates the official API on capability grounds — before cost even enters.

## Key findings

### 1. WhatsApp Cloud / Business API — cannot post to a real club group (and isn't free)
- The official API sends **1:1 template/session messages to individual opted-in numbers**.
  It has never supported sending into an ordinary multi-person group.
- Meta launched a **Groups Cloud API** on **2025-10-06**, but it is **capped at 8
  participants per group** (vs 1,024 for a normal WhatsApp group), requires members to
  join via a business-issued link, and is provider-gated (e.g. Sanuker/WOZTELL). It is
  built for small support/case threads, **not** broadcasting to an existing club group of
  dozens. So it does not solve this need either.
  ([Sanuker — WhatsApp Groups API](https://sanuker.com/whatsapp-groups-api-en/))
- Cost (even if a group could be reached): since **2025-07-01** Meta bills **per delivered
  template message**, not per 24-hour conversation. **User-initiated ("service")
  conversations are free** (since 2024-11-01) and utility templates inside an open
  24-hour service window are free — but a *session-result broadcast* is **business-
  initiated**, so it would be a billable template every time.
  ([Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing),
  [Blueticks 2026 pricing](https://blueticks.co/blog/whatsapp-business-api-pricing-2026))
- South Africa (+27) rates are low — **utility ≈ $0.008**, marketing ≈ $0.038 per message
  ([Yazi — SA pricing 2025](https://www.askyazi.com/articles/whatsapp-business-api-pricing---how-south-africa-compares-globally-2025)) —
  but the rate is irrelevant because **the group can't be reached**, and standing up a
  Business account + a Business Solution Provider is heavy setup for a club app.

### 2. `wa.me` click-to-chat link — cannot pre-fill into a group
- `https://wa.me/?text=...` opens a chat with a **pre-filled message** the user taps to
  send — but **only for 1:1 chats**. There is **no `wa.me` form that opens a group with
  pre-filled text**; group links (`chat.whatsapp.com/...`) are *join-invite* links, not
  message links.
  ([Qualimero — WhatsApp links](https://qualimero.com/en/blog/whatsapp-link),
  [WhatsApp Help — click to chat](https://faq.whatsapp.com/5913398998672934))
- So `wa.me` only helps if the target is a person, not the club group. Rules it out for
  the stated need.

### 3. Web Share API (`navigator.share`) — the viable tap-to-share path ✅
- A PWA can call `navigator.share({ text })` from a button tap; the OS share sheet opens
  with **WhatsApp as a target**, and the scorer then picks the **club group** manually and
  hits send. Zero cost, zero infra, ToS-clean (it's a human sending a normal message).
- Limitation (by design, for security): JS **cannot pre-select the target** — you can't
  programmatically choose "the club group". The user always chooses in the share sheet.
  ([web.dev — Web Share API](https://web.dev/web-share/),
  [MDN — share data between apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Share_data_between_apps))
- Already aligned with the app: it's a PWA (step 13), so `navigator.share` is available on
  the Android/Chrome devices scorers use. Falls back to copy-to-clipboard where unsupported.

### 4. Unofficial bridges (whatsapp-web.js, Baileys, Evolution API, etc.) — do not use
- Automating consumer WhatsApp is a **flagrant ToS violation**. Meta detects it via
  protocol fingerprinting + behavioural analysis; **unofficial-tool accounts typically
  last 2–8 weeks before a permanent ban**, and bans can hit within minutes.
  ([bot.space — risk analysis](https://www.bot.space/blog/whatsapp-api-vs-unofficial-tools-a-complete-risk-reward-analysis-for-2025),
  [kraya-ai — ban risk 2026](https://blog.kraya-ai.com/whatsapp-automation-ban-risk),
  [WhatsApp Help — automated/bulk messaging](https://faq.whatsapp.com/5957850900902049))
- This would put a club member's *personal* WhatsApp number at risk of a permanent ban for
  a non-critical convenience feature. Not justifiable.

## Side-by-side

| Option | Posts to group? | Cost | Infra/setup | ToS risk | Effort |
|---|---|---|---|---|---|
| **Web Share API (tap-to-share)** | ✅ user picks group | **R0** | none (PWA already) | none | **low** |
| Cloud API (1:1) | ✗ (no group) | per-msg (~$0.008 ZA utility) | Business acct + BSP | none | high |
| Groups Cloud API | ⚠️ only ≤8-person groups | per-msg | Business acct + BSP + provider | none | high |
| `wa.me` link | ✗ (1:1 only) | R0 | none | none | low |
| Unofficial bridge | ✅ but bannable | hosting (~R0–200) | self-hosted, always-on | **critical (2–8 wk ban)** | medium-high |

## Recommendation

**Build the Web Share API tap-to-share flow.** On successful session submit, show a
"Share result to WhatsApp" button that calls `navigator.share({ text })` with a formatted
result summary (e.g. teams, score, who moved up/down) and a link to the public ladder page.
The scorer taps once and picks the club group in the share sheet.

- **One tap, not automatic** — accept the manual pick; it's the only ToS-clean way to reach
  a group, and the scorer is already in the app at that moment.
- **Cost R0, infra R0** — no Business account, no BSP, no extra hosting, nothing on the Fly
  budget.
- **Fallback**: where `navigator.share` is unavailable (desktop browsers), fall back to a
  "Copy result" button (clipboard) so the scorer can paste into the group manually.
- This is a small UI step that can fold into a future plan round (e.g. extend the
  step-16.2 submit flow with a post-submit share action). It touches a user-facing route,
  so per PLAN.md it needs E2E coverage of the share button rendering + clipboard fallback
  (the native share sheet itself can't be driven in Playwright — assert the button calls
  `navigator.share`/clipboard with the right text).

## Implications for the project

- **No WhatsApp Business account, no per-message fees, no new infra.** The "cheaply"
  constraint is satisfied only by tap-to-share; every automated path fails on capability
  (API can't reach the group) or risk (bridge bans the account).
- The feature degrades to **"build the message + one tap"**, which is genuinely all the
  app can safely do. Manage expectations: it is not a fully automatic post.

## Resolved at build (step 16.4 — see [ADR-009](DECISIONS.md))

The tap-to-share direction was built in step 16.4; the two build-time questions are settled:

- **Share-sheet behaviour on real devices** — the Share button is gated on
  `navigator.share` **and** a coarse pointer (`matchMedia("(pointer: coarse)")`), so it
  shows only on touch-primary devices where the OS share sheet can reach the group; on
  desktop the success screen shows "View ladder" only.
- **Plain text, not files** — the share payload is plain text (`buildShareText` in
  [`../../lib/share.ts`](../../lib/share.ts)): date, each player + games won, and the
  public ladder link. No image/file share.

## Notes for the agent

- **Don't conflate** the three "official" things: (a) Cloud API 1:1 messaging,
  (b) the new **Groups Cloud API** (8-person cap — not for club broadcasts),
  (c) `wa.me` click-to-chat (1:1 only). All three fail the *post-to-group* need; only the
  **Web Share API** (a browser feature, not a WhatsApp product) works.
- WhatsApp API pricing flipped from **per-conversation** to **per-message** on
  **2025-07-01** — pre-2025 blog posts quoting "free conversations / 1000 free per month"
  are stale.
- `navigator.share` **cannot target a specific group** by design — never plan a feature
  that assumes programmatic group selection.

## Sources

- [Pricing on the WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) — Meta, 2026; per-message model, free service window.
- [WhatsApp Business API Pricing 2026](https://blueticks.co/blog/whatsapp-business-api-pricing-2026) — Blueticks, 2026; per-message switch dated 2025-07-01, free user-initiated convos.
- [WhatsApp Business API Pricing — How South Africa Compares (2025)](https://www.askyazi.com/articles/whatsapp-business-api-pricing---how-south-africa-compares-globally-2025) — Yazi, 2025; ZA utility ≈$0.008, marketing ≈$0.038.
- [WhatsApp Groups API](https://sanuker.com/whatsapp-groups-api-en/) — Sanuker, launched 2025-10-06; **8-participant cap**, provider-gated.
- [WhatsApp Link: wa.me, Chat, Group & Share Links](https://qualimero.com/en/blog/whatsapp-link) — Qualimero; wa.me is 1:1, group links are join-invites.
- [How to use click to chat](https://faq.whatsapp.com/5913398998672934) — WhatsApp Help Center; click-to-chat semantics.
- [Integrate with the OS sharing UI with the Web Share API](https://web.dev/web-share/) — web.dev; `navigator.share`, OS picks/owns target.
- [Share data between apps — PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Share_data_between_apps) — MDN; cannot pre-select share target.
- [WhatsApp API vs Unofficial Tools — Risk Analysis 2025](https://www.bot.space/blog/whatsapp-api-vs-unofficial-tools-a-complete-risk-reward-analysis-for-2025) — bot.space; ToS violation, ban risk.
- [WhatsApp Automation Ban Risk 2026](https://blog.kraya-ai.com/whatsapp-automation-ban-risk) — kraya-ai; 2–8 week account lifespan on unofficial tools.
- [Unauthorized use of automated or bulk messaging](https://faq.whatsapp.com/5957850900902049) — WhatsApp Help Center; official ToS position.
