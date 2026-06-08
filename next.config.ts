import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  /* config options here */
};

void import("@opennextjs/cloudflare").then((m) =>
  m.initOpenNextCloudflareForDev(),
);

export default withSerwist(nextConfig);
