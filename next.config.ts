import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The desktop app may expose the dev UI through a changing link-local
  // address. Next 16 otherwise blocks its client chunks as cross-origin
  // requests. Keep localhost as the recommended/safest access path.
  allowedDevOrigins: ["169.254.*.*"],
};

export default nextConfig;
