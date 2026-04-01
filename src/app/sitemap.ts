import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.AurumOracle.com'
  const now  = new Date().toISOString()
  return [
    { url: base,              lastModified: now, changeFrequency: 'hourly',  priority: 1.0 },
    { url: `${base}/learn`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/token`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/sale`,    lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/premium`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]
}
