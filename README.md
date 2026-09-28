# flyhub

Fly.io infrastructure for Kody: preview apps, runner and Brain machines,
terminal and browser transports, and image builders.

This repository preserves the history of `kody-chat/packages/fly`. The package
is consumed as TypeScript source at `packages/fly` in the Kody workspace.
Its `@kody-ade/base`, `@kody-ade/terminal`, and
`@kody-ade/engine-contracts` dependencies are supplied by that workspace.

## Layout

- `src/`: Fly providers, routes, previews, runners, machines, and transports
- `builder/`: preview image builder and app gateway images
- `browser/`: hosted browser runtime and Docker image
- `tests/`: package unit and live integration tests
- `src/dashboard/`: Fly pages and browser UI consumed by Kody route entrypoints

## Kody development checkout

Clone Kody with submodules, or run `git submodule update --init` in an existing
Kody checkout. From the Kody root, run `pnpm install`, then
`pnpm --filter @kody-ade/fly typecheck` and
`pnpm --filter @kody-ade/fly test:unit`.

The browser runtime has its own npm lockfile. The preview builder has its own
pnpm lockfile. Both can be developed and built from this repository root.
The dashboard UI imports Kody host layout, auth, and repository routing through
the `@dashboard` alias. Its integration is typechecked and browser-tested in
the Kody workspace; the Fly package's standalone typecheck covers its provider
and runtime code.

## Publishing

The browser image workflow builds `browser/Dockerfile` and publishes
`ghcr.io/aharonyaircohen/kody-browser`. The builder deployment uses
`builder/fly.toml` and `scripts/publish-preview-builder.mjs`. Kody's
`builder:publish` command invokes that script from the Flyhub checkout.

Do not put Fly API tokens or other secrets in this repository.
