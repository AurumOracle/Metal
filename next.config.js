/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.externals.push({
      'pg-native': 'commonjs pg-native',
    })
    return config
  },
}

module.exports = nextConfig
