import Head from "next/head"

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  canonicalUrl?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  twitterCard?: string
  structuredData?: object
  noindex?: boolean
}

export default function SEOHead({
  title = "Professional Epoxy Flooring Services | Crafted Surface Solutions",
  description = "Transform your floors with premium epoxy coatings. Residential & commercial epoxy flooring installation. Free estimates. 5-year warranty.",
  keywords = "epoxy flooring, garage floor coating, commercial flooring, residential epoxy, floor installation",
  canonicalUrl = "https://craftedsurface.com",
  ogTitle,
  ogDescription,
  ogImage = "/css-logo.png",
  ogType = "website",
  twitterCard = "summary_large_image",
  structuredData,
  noindex = false,
}: SEOHeadProps) {
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Crafted Surface Solutions" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional Meta Tags */}
      <meta name="author" content="Crafted Surface Solutions" />
      <meta name="language" content="en" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="Local Area" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </Head>
  )
}
