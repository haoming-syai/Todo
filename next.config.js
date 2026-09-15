/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Keep output tracing inside this repository. On Windows, following legacy
  // profile junctions such as `Application Data` causes EPERM during builds.
  outputFileTracingRoot: process.cwd(),
};

export default config;
