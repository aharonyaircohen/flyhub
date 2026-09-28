# flyhub

Fly.io infrastructure for Kody: preview apps, runner and Brain machines,
terminal and browser transports, and image builders.

This is a separate repository with the history of `kody-chat/packages/fly`.
Kody has not been switched to consume Flyhub. The TypeScript package still
imports Kody platform packages and currently requires a compatible Kody
workspace to typecheck and test all modules.

## Layout

- `src/`: Fly providers, routes, previews, runners, machines, and transports
- `builder/`: preview image builder and app gateway images
- `browser/`: hosted browser runtime and Docker image
- `tests/`: package unit and live integration tests
- `src/dashboard/`: Fly pages and browser UI consumed by Kody route entrypoints

## Development

The browser runtime has its own npm lockfile. The preview builder has its own
pnpm lockfile. Both can be developed and built from this repository root.
The dashboard UI imports Kody host layout, auth, and repository routing through
the `@dashboard` alias. Those adapters need a host application. The browser
image can be built from this repository root without a Kody checkout.

## Publishing

The browser image workflow builds `browser/Dockerfile` and publishes
`ghcr.io/aharonyaircohen/flyhub-browser`. The builder deployment uses
`builder/fly.toml` and `scripts/publish-preview-builder.mjs`. The GHCR image is
public so Fly Machines can pull it without registry credentials.

Do not put Fly API tokens or other secrets in this repository.
