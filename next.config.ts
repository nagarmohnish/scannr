import type { NextConfig } from "next";

// When STATIC_EXPORT=true (set by the GitHub Pages workflow) we build a static
// site that lives at /<repo>/ on github.io. In normal `next dev` / `next build`
// the app runs as a normal server-rendered Next.js app with API routes.
const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
