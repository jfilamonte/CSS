import { NextResponse } from "next/server"

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Important pages
Allow: /
Allow: /services
Allow: /about
Allow: /contact
Allow: /quote

# Block admin areas
Disallow: /admin-new/
Disallow: /api/

# Sitemap
Sitemap: https://craftedsurface.com/sitemap.xml

# Crawl delay
Crawl-delay: 1`

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
    },
  })
}
