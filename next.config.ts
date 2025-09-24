import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  estint: {
    ignoreDuringBuilds : true,
  },
  typescript: {
    ignoreBuildErrors :
    true,
  }
 
};


export default nextConfig;
