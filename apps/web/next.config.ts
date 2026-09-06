import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Turbopack walks up looking for a lockfile and guesses wrong inside a pnpm
  // workspace, especially with other lockfiles elsewhere on this machine.
  // Pin it to the monorepo root.
  turbopack: { root: path.resolve(__dirname, "../..") },
  // firebase-admin pulls in jose, which fails with ERR_REQUIRE_ESM in a
  // bundled production build but not in dev. Keep it external.
  serverExternalPackages: ["firebase-admin"],
  transpilePackages: ["@pukaar/ui", "@pukaar/core"],
};

export default nextConfig;
