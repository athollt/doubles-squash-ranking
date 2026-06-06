# Research: Fly.io vs Hetzner for the BSC Squash Ladder

**Date**: 2026-06-06
**Question**: Should step 14.2 continue with the planned Hetzner Cloud CX22 setup, or
switch the deployment plan to Fly.io? App = Next.js 16 standalone + PostgreSQL +
Auth.js, ZA users, tiny always-on, R50–R400/mo budget.
**Verdict**: **Stay on Hetzner.** Fly's deploy ergonomics are genuinely nicer, but its
**Managed Postgres is not available in Johannesburg**, which collapses Fly's main
advantage (managed DB) into the *same* self-managed-Postgres trade-off Hetzner already
has — at similar or higher cost and with less control over a single co-located box.

---

## Key findings

### Pricing (pay-as-you-go since Oct 2024; no free tier for new accounts)
- **Compute**: `shared-cpu-1x` 256MB ≈ **$2.02/mo**, 1GB ≈ **$5.92/mo** always-on.
- **Volumes**: **$0.15/GB/mo**.
- **Bandwidth**: $0.02/GB egress (NA/EU rates; ZA may differ).
- **Dedicated IPv4**: $2/mo. **TLS certs**: first 10 hostnames free, then $0.10/mo.
- New Pay-As-You-Go accounts get **no free allowances** (legacy plans grandfathered).
- Source: [Fly Resource Pricing](https://fly.io/docs/about/pricing/).

### Postgres — the decisive point
- **Managed Postgres (MPG)**: cheapest plan **$38/mo** (Shared-2x, 1GB) + $0.28/GB
  storage; includes HA, backups, pooling. **Available in 12 regions — Johannesburg is
  NOT one of them** (nearest: São Paulo `gru` or London `lhr`, ~150–200ms from ZA).
  Sources: [Managed Postgres docs](https://fly.io/docs/mpg/).
- **Unmanaged Fly Postgres**: a Postgres app on a Machine + volume. ~**$2–7/mo**, *can*
  run in jnb (co-located), **but you own backups, upgrades, failover yourself** — i.e.
  the same operational burden as self-hosting on Hetzner. Source:
  [Fly Postgres (unmanaged)](https://fly.io/docs/postgres/).
- **So on Fly you must choose**: managed-but-far (latency + $38/mo, defeats the ZA
  rationale) OR cheap-and-local-but-self-managed (no convenience win over Hetzner).

### Region / latency
- **jnb (Johannesburg)** is a current, operational compute region (caveat: no WireGuard
  gateway — irrelevant for a public web app). No capacity warnings found for jnb.
  Sources: [Regions](https://fly.io/docs/reference/regions/),
  [Fly is in Johannesburg](https://fly.io/blog/fly-in-johannesburg/).
- Hetzner **Cape Town** is the planned region — also ZA, comparable local latency.
- Net: **both give a ZA app location**; the difference is the *database* location, where
  Hetzner (same box) wins on latency-per-rand and Fly's managed option loses (not in ZA).

### Deploy / TLS / custom domain (Fly's real strength)
- `fly deploy --remote-only` via [superfly/flyctl-actions](https://github.com/superfly/flyctl-actions)
  + a `FLY_API_TOKEN` secret — **simpler than the planned GHCR build + SSH + compose**.
  Source: [Continuous Deployment with GitHub Actions](https://fly.io/docs/launch/continuous-deployment-with-github-actions/).
- `fly certs add squash.tomlinson.co.za` → **auto Let's Encrypt**, managed/renewed. This
  replaces Caddy. Source: [Custom domains](https://fly.io/docs/networking/custom-domain/).

---

## Side-by-side

| Factor | **Hetzner CX22 (planned)** | **Fly.io** |
|---|---|---|
| App location (ZA) | Cape Town ✅ | Johannesburg ✅ |
| DB co-located in ZA | ✅ same box, ~0ms | ⚠️ only via **unmanaged** PG (self-run) |
| Managed DB option | ✗ (self-host) | ✅ but **not in ZA** ($38/mo + 150ms) |
| Backups | you script `pg_dump`→S3 | MPG auto / unmanaged = you script it |
| Monthly cost (tiny) | ~€5 VPS + ~€1 backups ≈ **R130–190** | app ~$6 + IPv4 $2 + unmanaged PG ~$5 ≈ **$13 ≈ R240**; MPG path ≈ **$44+ ≈ R800+** |
| TLS / domain | Caddy auto-SSL | `fly certs` auto-SSL (simpler) |
| CI/CD | build→GHCR→SSH→compose | `fly deploy` (simpler) |
| Ops model | one VPS you fully control | managed Machines; less host control |
| Multi-app future (RESEARCH §9) | add compose service + Caddy block | add another Fly app |
| Vendor lock-in | low (plain Docker/PG) | medium (fly.toml, Machines, flyctl) |

---

## Implications for the project

- **The original RESEARCH-tech-stack.md §3 rationale still holds**: "the latency
  difference of 150–250ms to a cloud-managed database is the killer issue." Fly does not
  escape it — its managed PG isn't in ZA. The self-hosted-PG-on-one-box decision (and
  ADR-001/002 full-recalc-on-read, which assumes ~0ms DB) is exactly what Hetzner gives.
- **What Fly would genuinely improve**: deploy simplicity. The planned step-14.4 work
  (multi-stage Dockerfile, `docker-compose.prod.yml`, Caddyfile, GHCR push, SSH deploy,
  `prisma migrate deploy` over SSH) collapses to a `fly.toml`, `fly deploy`, and
  `fly certs`. That's a real reduction in moving parts — but it's a *convenience* gain,
  not a capability the app needs, and the team has already paid most of the Hetzner
  learning cost (14.1 done; runbooks written).
- **Cost**: cheapest sane Fly setup (app + unmanaged PG + IPv4) ≈ R240/mo, slightly
  above Hetzner's ~R130–190 and *with* self-managed PG anyway. The managed-PG path blows
  the budget (R800+) and adds latency.
- **If we switched**, step 14.4 and runbook 02 would be rewritten (no VPS/SSH/Caddy/
  compose; instead `fly launch`, `fly volumes`, `fly secrets`, `fly certs`, a Postgres
  app, and a backup cron via a scheduled Machine or external `pg_dump`). Runbook 01
  (Google OAuth) and 03 (GitHub) stay ~unchanged. Net: meaningful re-plan for a
  convenience win.

## Recommendation

**Continue 14.2 with Hetzner as planned.** Reasons: (1) Fly's flagship advantage
(managed Postgres) isn't available in ZA, so it doesn't beat Hetzner on the one axis the
project optimised for (DB latency); (2) cost is similar-to-worse; (3) you'd still
self-manage Postgres on the cheap Fly path; (4) Hetzner work is already underway. Revisit
Fly only if deploy simplicity becomes a priority over DB latency/cost, or if Fly ships
Managed Postgres in jnb.

> Optional middle ground (not recommended now): Fly app in jnb + unmanaged Fly Postgres
> in jnb. Gets the simpler deploy and ZA co-location, but you still own backups and it
> costs a bit more — only worth it if you specifically want to drop the VPS/SSH model.

## Open questions
- Exact Fly **egress price for the jnb/ZA region group** (docs quote NA/EU rates; ZA may
  differ) — minor at this traffic level.
- Whether Fly plans to bring **Managed Postgres to jnb** — would change this verdict.

## Notes for the agent
- Fly pricing is **pay-as-you-go since Oct 2024**; older blog posts quoting Hobby/Launch
  plans or free tiers are stale.
- "Fly Postgres" (unmanaged, `fly pg`) ≠ "Managed Postgres / MPG" — different products,
  prices, and region lists. Don't conflate them.
- MPG region list (no jnb) verified from [docs/mpg](https://fly.io/docs/mpg/) on
  2026-06-06; re-check before any switch.

## Sources
- [Fly Resource Pricing](https://fly.io/docs/about/pricing/) — 2026, compute/volume/bandwidth/IPv4/TLS.
- [Managed Postgres docs](https://fly.io/docs/mpg/) — 2026, plans, prices, **region list (no jnb)**.
- [Fly Postgres (unmanaged)](https://fly.io/docs/postgres/) — self-managed model.
- [Regions](https://fly.io/docs/reference/regions/) — jnb operational, no-gateway caveat.
- [Fly is in Johannesburg](https://fly.io/blog/fly-in-johannesburg/) — Jan 2023, jnb full-stack.
- [Continuous Deployment with GitHub Actions](https://fly.io/docs/launch/continuous-deployment-with-github-actions/) — `flyctl deploy` CI.
- [superfly/flyctl-actions](https://github.com/superfly/flyctl-actions) — the GH Action.
- [Custom domains](https://fly.io/docs/networking/custom-domain/) + [fly certs](https://fly.io/docs/flyctl/certs/) — auto Let's Encrypt.
- Cross-reference: project's own [RESEARCH-tech-stack.md](RESEARCH-tech-stack.md) §3, §7, §9.
