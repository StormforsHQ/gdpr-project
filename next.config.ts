import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["cheerio"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
