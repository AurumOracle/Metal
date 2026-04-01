import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/api/', '/premium/'],
      },
    ],
    sitemap: 'https://www.AurumOracle.com/sitemap.xml',
  }
}
