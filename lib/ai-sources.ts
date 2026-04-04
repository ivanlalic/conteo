// AI traffic source definitions and detection functions

export interface AISource {
  name: string
  type: 'human' | 'bot'
  referrerPatterns: string[]
  userAgentPatterns: string[]
}

export const AI_SOURCES: AISource[] = [
  // ===== HUMAN TRAFFIC FROM AI (clicks on links) =====
  {
    name: 'ChatGPT',
    type: 'human',
    referrerPatterns: ['chatgpt.com', 'chat.openai.com'],
    userAgentPatterns: [],
  },
  {
    name: 'Claude',
    type: 'human',
    referrerPatterns: ['claude.ai'],
    userAgentPatterns: [],
  },
  {
    name: 'Perplexity',
    type: 'human',
    referrerPatterns: ['perplexity.ai'],
    userAgentPatterns: [],
  },
  {
    name: 'Gemini',
    type: 'human',
    referrerPatterns: ['gemini.google.com'],
    userAgentPatterns: [],
  },
  {
    name: 'Copilot',
    type: 'human',
    referrerPatterns: ['copilot.microsoft.com'],
    userAgentPatterns: [],
  },
  {
    name: 'DeepSeek',
    type: 'human',
    referrerPatterns: ['chat.deepseek.com'],
    userAgentPatterns: [],
  },
  {
    name: 'Poe',
    type: 'human',
    referrerPatterns: ['poe.com'],
    userAgentPatterns: [],
  },
  {
    name: 'You.com',
    type: 'human',
    referrerPatterns: ['you.com'],
    userAgentPatterns: [],
  },
  {
    name: 'Kagi',
    type: 'human',
    referrerPatterns: ['kagi.com'],
    userAgentPatterns: [],
  },
  {
    name: 'Phind',
    type: 'human',
    referrerPatterns: ['phind.com'],
    userAgentPatterns: [],
  },

  // ===== AI BOTS (automated fetching) =====
  {
    name: 'ChatGPT Bot',
    type: 'bot',
    referrerPatterns: [],
    userAgentPatterns: ['chatgpt-user', 'oai-searchbot', 'gptbot'],
  },
  {
    name: 'Claude Bot',
    type: 'bot',
    referrerPatterns: [],
    userAgentPatterns: ['claudebot', 'claude-web', 'anthropic'],
  },
  {
    name: 'Perplexity Bot',
    type: 'bot',
    referrerPatterns: [],
    userAgentPatterns: ['perplexitybot'],
  },
  {
    name: 'Google AI Bot',
    type: 'bot',
    referrerPatterns: [],
    userAgentPatterns: ['google-extended'],
  },
  {
    name: 'Meta AI Bot',
    type: 'bot',
    referrerPatterns: [],
    userAgentPatterns: ['meta-externalagent', 'facebookbot'],
  },
  {
    name: 'Cohere Bot',
    type: 'bot',
    referrerPatterns: [],
    userAgentPatterns: ['cohere-ai'],
  },
  {
    name: 'Common Crawl',
    type: 'bot',
    referrerPatterns: [],
    userAgentPatterns: ['ccbot'],
  },
]

/**
 * Detect if a request comes from an AI source.
 * Checks user-agent first (bots), then referrer (humans clicking links).
 */
export function detectAISource(
  referrer: string | null,
  userAgent: string | null
): { source: string | null; type: 'human' | 'bot' | null } {
  // Check user-agent for bots
  if (userAgent) {
    const ua = userAgent.toLowerCase()
    for (const src of AI_SOURCES) {
      for (const pattern of src.userAgentPatterns) {
        if (ua.includes(pattern)) {
          return { source: src.name, type: src.type }
        }
      }
    }
  }

  // Check referrer for human AI traffic
  if (referrer) {
    const ref = referrer.toLowerCase()
    for (const src of AI_SOURCES) {
      for (const pattern of src.referrerPatterns) {
        if (ref.includes(pattern)) {
          return { source: src.name, type: src.type }
        }
      }
    }
  }

  return { source: null, type: null }
}

/** AI referrer domains for frontend badge matching */
const AI_REFERRER_DOMAINS: Record<string, string> = {
  'chatgpt.com': 'ChatGPT',
  'chat.openai.com': 'ChatGPT',
  'claude.ai': 'Claude',
  'perplexity.ai': 'Perplexity',
  'gemini.google.com': 'Gemini',
  'copilot.microsoft.com': 'Copilot',
  'chat.deepseek.com': 'DeepSeek',
  'poe.com': 'Poe',
  'you.com': 'You.com',
  'kagi.com': 'Kagi',
  'phind.com': 'Phind',
}

/**
 * Check if a source name (from get_referrer_sources) is an AI source.
 * Works with both domain strings and display names.
 */
export function isAISource(source: string): boolean {
  const s = source.toLowerCase()
  // Check against display names
  for (const displayName of Object.values(AI_REFERRER_DOMAINS)) {
    if (s === displayName.toLowerCase()) return true
  }
  // Check against domain patterns
  for (const domain of Object.keys(AI_REFERRER_DOMAINS)) {
    if (s.includes(domain)) return true
  }
  return false
}

/**
 * Get clean display name for an AI referrer domain.
 */
export function getAIDisplayName(source: string): string | null {
  const s = source.toLowerCase()
  for (const [domain, name] of Object.entries(AI_REFERRER_DOMAINS)) {
    if (s.includes(domain)) return name
  }
  return null
}
