/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add this block to force Turbopack to use your current folder as the root
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
};

export default nextConfig;