# Flyhub preview builder

This image runs one build per Fly Machine. Flyhub supplies the repository, ref, target app, Fly token, and a derived preview verification key as machine environment variables. The builder clones the repository, builds and pushes its preview image with Fly's remote builder, starts the preview machine, and exits.

The builder image is hosted in the Fly registry of the `flyhub-preview-builder` app. Publish it with `pnpm builder:publish` from the repository root after setting `FLY_API_TOKEN` and `FLY_ORG_SLUG`. The publisher creates the host app when needed, runs `flyctl deploy --build-only --push`, and removes accidental host machines. Publish the image before the first preview build.

Set `FLYHUB_MASTER_KEY` in the dashboard environment. Flyhub derives a verification key and sends only that key to the builder, which passes it to the preview machine. Private repositories also need `GITHUB_TOKEN` in the dashboard environment.

Build the image locally with:

```sh
docker build -f builder/Dockerfile -t flyhub-builder:local builder
```
