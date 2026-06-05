# Step 13: PWA & branding

## Objective
Configure PWA (manifest, service worker, icons) and create the visual identity (logo, favicon, app icons, OG image).

## Context
- Step 09 delivered: public ladder page (the primary PWA entry point).
- See RESEARCH-tech-stack.md §6 for Serwist/PWA config.
- See PRD § Branding & Assets, § PWA Configuration, user stories #7, #22, #23.

## Specification

### Branding assets to create:
1. **Logo** — simple, modern mark incorporating a squash racket or ball motif. Suitable for both light and dark backgrounds. SVG master + PNG exports.
2. **Favicon** — 32×32 PNG and ICO.
3. **PWA icons** — 192×192 and 512×512 PNG (required by manifest.json).
4. **Apple touch icon** — 180×180 PNG.
5. **Open Graph image** — 1200×630 PNG for link previews (shows app name + logo on a branded background).
6. **Colour palette** — define primary, secondary, accent, background colours in `tailwind.config.ts`. Use throughout logo and UI.

Place all assets in `/public`.

### PWA configuration:
1. Install `@serwist/next`.
2. Create `app/sw.ts` — minimal service worker with offline fallback.
3. Create `public/manifest.json`:
   - `name`: "BSC Squash Ladder"
   - `short_name`: "Squash"
   - `start_url`: "/"
   - `display`: "standalone"
   - `theme_color` and `background_color` from the palette
   - Icons: 192 and 512
4. Add manifest link and meta tags to the root layout (`app/layout.tsx`).
5. Add Apple touch icon meta tag.
6. Configure `next.config.ts` with Serwist wrapper.

### UI polish:
- Add logo to the ladder page header.
- Consistent colour palette applied across all pages.

**Behaviours to verify (TDD order):**
1. `/manifest.json` is served and contains correct fields.
2. Service worker registers successfully in the browser.
3. Favicon appears in browser tab.
4. Apple touch icon meta tag present in HTML head.
5. OG image meta tag present in HTML head.
6. App is installable from Chrome/Safari "Add to Home Screen" (manual verification).
7. `npm run build` succeeds with Serwist configured.

## Validation
```bash
npm run build
# Manual: open in Chrome DevTools → Application → Manifest → verify installability
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-13: PWA & branding`
4. Push `at-wip`
