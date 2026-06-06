# Deployment Runbook 02 — Hetzner production environment

**Step**: 14.2 · **Owner**: you (manual) · **Gates**: 14.4 (deployment)
**Goal**: stand up the production VPS, DNS, deploy user/SSH key, firewall, and the
backup bucket — everything the running app needs *except* the app image itself
(that's built and shipped by step 14.4's GitHub Actions workflow).

This runbook produces values used by [03-github-actions.md](03-github-actions.md):

- `VPS_HOST` (the server's public IP)
- `VPS_SSH_KEY` (the `deploy` user's **private** key)
- A Postgres password and an `AUTH_SECRET` (also placed in the VPS `.env`)
- Hetzner Object Storage S3 credentials (for the backup cron)

---

## Prerequisites

- A **Hetzner Cloud** account (<https://console.hetzner.com/>). Add a payment method.
- Access to DNS for **tomlinson.co.za** (to add the `squash` A record).
- Completed [01-google-oauth.md](01-google-oauth.md) so you have the Google client
  ID/secret to put in `.env`.

---

## Steps

### 1. Provision the server
1. Hetzner Cloud Console → **New Project** (e.g. `bsc-squash`).
2. **Add Server**:
   - Location: **Cape Town (ZA)** — lowest local latency (RESEARCH §7).
   - Image: **Ubuntu 24.04**.
   - Type: **CX22** (2 vCPU, 4 GB, 40 GB) — ~€4.90/mo.
   - **SSH key**: add your *personal* admin public key (for first login). You'll create
     a separate `deploy` key in step 4.
   - Optionally enable the **Docker CE** app / cloud-init, or install Docker manually
     in step 2.
   - Create. Note the **public IPv4** → this is `VPS_HOST`.

### 2. Install Docker (skip if the Docker CE image was used)
SSH in as `root@<VPS_HOST>` and:
```bash
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

### 3. DNS A record
In the DNS zone for `tomlinson.co.za`, add:
```
Type: A   Name: squash   Value: <VPS_HOST>   TTL: 300
```
Verify (may take a few minutes):
```bash
dig +short squash.tomlinson.co.za   # should print <VPS_HOST>
```
> DNS must resolve before first `docker compose up`, or Caddy can't get a TLS cert.

### 4. Create the deploy user + its SSH key
On the VPS as root:
```bash
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
```
On **your local machine**, generate a dedicated keypair for CI (no passphrase — it
runs unattended):
```bash
ssh-keygen -t ed25519 -C "deploy@squash" -f ~/.ssh/squash_deploy -N ""
```
Install the **public** key on the VPS:
```bash
# paste the contents of ~/.ssh/squash_deploy.pub into:
/home/deploy/.ssh/authorized_keys      # then:
chown -R deploy:deploy /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```
The **private** key `~/.ssh/squash_deploy` becomes the `VPS_SSH_KEY` GitHub Secret (14.3).
Test: `ssh -i ~/.ssh/squash_deploy deploy@<VPS_HOST> "docker ps"`.

### 5. Firewall
Use the free **Hetzner Cloud Firewall** (console) — allow inbound **22, 80, 443**
only, deny everything else. Attach it to the server. (RESEARCH §7.)

### 6. App directory + `.env`
As the `deploy` user:
```bash
cd /home/deploy && git clone https://github.com/athollt/doubles-squash-ranking.git squash
cd squash && cp .env.example .env
```
Generate secrets and edit `.env`:
```bash
openssl rand -base64 32     # → AUTH_SECRET
openssl rand -base64 24     # → a strong Postgres password (DB_PASSWORD)
```
Set in `/home/deploy/squash/.env` (production values — **not** the localhost defaults):
```bash
AUTH_URL=https://squash.tomlinson.co.za
AUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from runbook 01>
GOOGLE_CLIENT_SECRET=<from runbook 01>
DB_PASSWORD=<openssl rand -base64 24>
DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@postgres:5432/squash
```
> Note `@postgres:5432` (the Docker service name), not `localhost:5433` — production
> Postgres is a compose service. The first real `docker compose up` + migrate + seed
> happens in **14.4** (after the compose/Dockerfile/Caddyfile exist).

### 7. Backup target — Hetzner Object Storage
1. Hetzner Console → **Object Storage** → create a bucket, e.g. `squash-backups`
   (Falkenstein `fsn1` is fine; backups aren't latency-sensitive).
2. Create **S3 credentials** (access key + secret). Store them.
3. The backup cron itself (`pg_dump` → `aws s3 cp` to the Hetzner S3 endpoint) is set
   up as part of **14.4** per `docs/DEPLOYMENT.md`; this runbook just provisions the
   bucket + credentials so they exist when 14.4 wires the cron.

---

## Outputs (carry forward to 14.3 / 14.4)

| Value | Used in |
|---|---|
| `VPS_HOST` (public IPv4) | GitHub Secret, DNS |
| `VPS_SSH_KEY` (`~/.ssh/squash_deploy` private key) | GitHub Secret |
| `AUTH_SECRET`, `DB_PASSWORD`, `DATABASE_URL` | VPS `.env` (+ GitHub Secrets per 14.3) |
| S3 access key / secret / bucket / endpoint | backup cron (14.4) |
