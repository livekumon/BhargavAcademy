import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["@libsql/client", "@google-cloud/storage"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
