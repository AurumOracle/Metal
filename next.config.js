/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['www.meld.gold', 'app.nf.domains'],
  },
  webpack: (config) => {
    // use-wallet v4 bundles ALL wallet providers but most are optional peer deps.
    // Alias missing optional providers to false so webpack skips them.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@web3auth/modal': false,
      '@web3auth/base': false,
      '@web3auth/base-provider': false,
      '@web3auth/single-factor-auth': false,
      'magic-sdk': false,
      '@magic-sdk/provider': false,
      '@magic-sdk/admin': false,
    }
    return config
  },
}

module.exports = nextConfig
