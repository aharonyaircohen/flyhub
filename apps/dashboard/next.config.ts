import type { NextConfig } from "next";
import { resolve } from "node:path";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: { externalDir: true },
  turbopack: { root: resolve(import.meta.dirname, "../..") },
};

export default config;
