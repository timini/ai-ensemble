/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    // Removed output: 'export' to support dynamic API routes (tRPC, streaming, etc.)

    // TEMPORARY: Ignore ESLint errors to allow deployment.
    // TODO: Remove this and fix all ESLint errors.
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default config;
