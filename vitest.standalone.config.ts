import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/unit/app-access-ticket.spec.ts",
      "tests/unit/app-access-token.spec.ts",
      "tests/unit/app-deploy-config.spec.ts",
      "tests/unit/app-doorman.spec.ts",
      "tests/unit/app-machine-wait.spec.ts",
      "tests/unit/app-resources-client.spec.ts",
      "tests/unit/app-runtime-name.spec.ts",
      "tests/unit/app-source-detector.spec.ts",
      "tests/unit/app-verification.spec.ts",
      "tests/unit/browser-frame-flow.spec.ts",
      "tests/unit/browser-stream-protocol.spec.ts",
      "tests/unit/preview-environments.spec.ts",
      "tests/unit/ssh-machine.spec.ts",
      "tests/unit/ssh-provisioning.spec.ts",
      "tests/unit/publish-builder.spec.ts",
    ],
  },
});
