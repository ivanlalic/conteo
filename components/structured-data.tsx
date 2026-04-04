interface ArticleProps {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  url: string;
  image?: string;
}

export function ArticleStructuredData({
  title,
  description,
  publishedAt,
  updatedAt,
  author,
  url,
  image,
}: ArticleProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: {
      "@type": "Organization",
      name: author,
      "@id": "https://conteo.online/#organization",
    },
    publisher: {
      "@type": "Organization",
      name: "Conteo",
      "@id": "https://conteo.online/#organization",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: image || "https://conteo.online/og-image.png",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQStructuredData({ faqs }: { faqs: FAQItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function HowToStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Add Free Analytics to Your Website",
    description:
      "Add Conteo free web analytics to your website in 2 minutes. No cookies, GDPR compliant.",
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        name: "Create a free account",
        text: "Sign up at conteo.online — free, no credit card required.",
        url: "https://conteo.online/signup",
      },
      {
        "@type": "HowToStep",
        name: "Add your website",
        text: "Enter your website domain in the Conteo dashboard.",
      },
      {
        "@type": "HowToStep",
        name: "Copy the tracking script",
        text: "Copy the one-line tracking script with your unique API key.",
      },
      {
        "@type": "HowToStep",
        name: "Paste into your site",
        text: "Add the script tag before the closing </head> tag on your website. Data starts flowing immediately.",
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

export function AboutPageStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Conteo",
    description:
      "Conteo is a free, privacy-first web analytics tool. No cookies, GDPR compliant, lightweight tracking script under 1KB.",
    mainEntity: { "@id": "https://conteo.online/#organization" },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

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
