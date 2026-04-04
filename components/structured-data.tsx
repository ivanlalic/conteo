export function WebsiteStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://conteo.online/#website",
        url: "https://conteo.online",
        name: "Conteo",
        description:
          "Simple and private analytics for your website. No cookies, GDPR compliant.",
        publisher: { "@id": "https://conteo.online/#organization" },
        inLanguage: "en",
      },
      {
        "@type": "Organization",
        "@id": "https://conteo.online/#organization",
        name: "Conteo",
        url: "https://conteo.online",
        logo: {
          "@type": "ImageObject",
          url: "https://conteo.online/icon.png",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function SoftwareApplicationStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Conteo",
    url: "https://conteo.online",
    applicationCategory: "AnalyticsApplication",
    operatingSystem: "Web",
    description:
      "Privacy-first web analytics. No cookies, GDPR compliant, real-time dashboard. One line of code. Free for small sites.",
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        name: "Free",
        description: "1 site, 10,000 visits/mo",
      },
      {
        "@type": "Offer",
        price: "4.90",
        priceCurrency: "USD",
        name: "Pro",
        description: "3 sites, 50,000 visits/mo",
      },
      {
        "@type": "Offer",
        price: "9.90",
        priceCurrency: "USD",
        name: "Business",
        description: "10 sites, 100,000 visits/mo",
      },
    ],
    featureList: [
      "Real-time analytics dashboard",
      "No cookies required",
      "GDPR compliant by design",
      "Lightweight tracking script (<1KB)",
      "Top pages and traffic sources",
      "Country and device breakdown",
      "CSV data export",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
