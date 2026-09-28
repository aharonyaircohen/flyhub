# Flyhub

Flyhub is a separate repository for Fly.io infrastructure. Its standalone dashboard connects directly to a Fly organization. The browser runtime and preview builder also live here.

## Run locally

Install Node 22 and pnpm 9, then run:

```sh
pnpm install --frozen-lockfile
cp apps/dashboard/.env.example apps/dashboard/.env.local
# Set FLYHUB_ADMIN_TOKEN, FLY_API_TOKEN, and FLY_ORG_SLUG in .env.local.
pnpm dev
```

Open `http://127.0.0.1:3355`. The dashboard listens on loopback, keeps the Fly token server side, and requires its own admin token. It currently lists the organization's apps and their machines and volumes and can start, stop, suspend, or destroy machines.

`pnpm test`, `pnpm typecheck`, and `pnpm build` verify the standalone workspace. The active workspace installs no Kody packages.

## Repository layout

- `apps/dashboard/`: Flyhub dashboard, login, and Fly API routes
- `browser/`: browser runtime and published Docker image
- `builder/`: preview image builder and app gateway images
- `src/`: extracted Fly providers and older Kody integration code
- `tests/`: portable Fly tests and older Kody integration tests

The old Kody route, vault, backend, and UI adapters in `src/` remain as migration source. They are outside the active workspace build. Preview creation, browser sessions, runners, and terminal transport still need Flyhub owned entry points before the entire system is independent. Kody has not been switched to Flyhub.

## Images

The browser image workflow publishes `ghcr.io/aharonyaircohen/flyhub-browser`. The preview builder is still configured to publish to `kody-preview-builder`; its image and Fly app must move to Flyhub before independent preview builds are ready.

Never commit Fly tokens or other secrets.
