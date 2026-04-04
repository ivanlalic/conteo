'use client'

import { useState } from 'react'

function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconCheckSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const SNIPPETS: Record<string, { label: string; code: string }> = {
  html: {
    label: 'HTML',
    code: '<script defer\n  src="https://conteo.online/tracker.js"\n  data-api-key="YOUR_API_KEY">\n</script>',
  },
  wordpress: {
    label: 'WordPress',
    code: '<!-- Appearance > Theme Editor >\n   header.php, before </head> -->\n<script defer\n  src="https://conteo.online/tracker.js"\n  data-api-key="YOUR_API_KEY">\n</script>',
  },
  shopify: {
    label: 'Shopify',
    code: '<!-- Online Store > Themes > Edit code\n   > theme.liquid, before </head> -->\n<script defer\n  src="https://conteo.online/tracker.js"\n  data-api-key="YOUR_API_KEY">\n</script>',
  },
  nextjs: {
    label: 'Next.js',
    code: "// app/layout.tsx\nimport Script from 'next/script'\n\nexport default function Layout({ children }) {\n  return (\n    <html>\n      <body>\n        {children}\n        <Script\n          src=\"https://conteo.online/tracker.js\"\n          data-api-key=\"YOUR_API_KEY\"\n          strategy=\"afterInteractive\"\n        />\n      </body>\n    </html>\n  )\n}",
  },
}

export default function CodeSnippets() {
  const [activeTab, setActiveTab] = useState('html')
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(SNIPPETS[activeTab].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-[700px] mx-auto">
        <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center mb-3">
          One line. Two minutes. Done.
        </h2>
        <p className="text-center text-neutral-500 dark:text-neutral-400 mb-8">
          Paste this line in your site&apos;s <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">&lt;head&gt;</code>. That&apos;s it.
        </p>

        <div className="flex gap-1 mb-0 bg-neutral-100 dark:bg-neutral-800 rounded-t-lg p-1 overflow-x-auto">
          {Object.entries(SNIPPETS).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                activeTab === key
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative code-block rounded-b-lg overflow-hidden">
          <pre className="p-5 text-[13px] leading-relaxed overflow-x-auto font-mono">
            <code>{SNIPPETS[activeTab].code}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-neutral-300 px-2.5 py-1.5 rounded-md text-xs font-medium transition"
          >
            {copied ? (
              <>
                <IconCheckSmall />
                Copied
              </>
            ) : (
              <>
                <IconCopy />
                Copy
              </>
            )}
          </button>
        </div>

        <p className="text-center text-sm text-neutral-400 dark:text-neutral-500 mt-4">
          Data starts flowing in immediately.
        </p>
      </div>
    </section>
  )
}
