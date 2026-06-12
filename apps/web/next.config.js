/** @type {import("next").NextConfig} */
const nextConfig = {
  // Vercel optimizes serverless functions natively; standalone is only for Docker/self-hosting.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
}

module.exports = nextConfig

