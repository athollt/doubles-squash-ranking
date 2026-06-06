import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  output: "standalone",
};

// Serwist is a webpack plugin; Next 16 dev defaults to Turbopack and errors when
// a webpack config is present without a turbopack one. So only wrap for the
// (webpack) production build — `next build --webpack`, see package.json — and
// leave dev as a clean Turbopack config. The SW is a build artifact anyway.
const config =
  process.env.NODE_ENV === "development"
    ? nextConfig
    : withSerwistInit({
        swSrc: "app/sw.ts",
        swDest: "public/sw.js",
      })(nextConfig);

export default config;
