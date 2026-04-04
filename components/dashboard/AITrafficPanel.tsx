'use client'

interface AITrafficData {
  ai_source: string
  ai_type: string
  visitors: number
  pageviews: number
  percentage: number
}

interface AITrafficPanelProps {
  data: AITrafficData[]
}

export default function AITrafficPanel({ data }: AITrafficPanelProps) {
  const humanSources = data.filter(d => d.ai_type === 'human')
  const botSources = data.filter(d => d.ai_type === 'bot')

  const totalHumanVisitors = humanSources.reduce((sum, d) => sum + d.visitors, 0)
  const totalHumanPageviews = humanSources.reduce((sum, d) => sum + d.pageviews, 0)
  const maxVisitors = Math.max(...humanSources.map(d => d.visitors), 1)

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* AI Human Traffic */}
      <div className="border border-border rounded-lg bg-bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-text-primary">
            AI Traffic
          </h3>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            AI
          </span>
        </div>
        <p className="text-xs text-text-tertiary mb-3">
          Visitors arriving from AI tools like ChatGPT, Claude, Perplexity, etc.
        </p>

        {humanSources.length === 0 ? (
          <p className="text-sm text-text-tertiary py-4">No AI referral traffic yet</p>
        ) : (
          <>
            <div className="flex gap-4 mb-4 text-sm">
              <div>
                <span className="text-text-tertiary">Visitors: </span>
                <span className="font-medium text-text-primary">{totalHumanVisitors.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Pageviews: </span>
                <span className="font-medium text-text-primary">{totalHumanPageviews.toLocaleString()}</span>
              </div>
            </div>

            <div className="data-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="pb-2 text-left pr-2">Source</th>
                    <th className="pb-2 text-right pr-2">Visitors</th>
                    <th className="pb-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {humanSources.map((row) => (
                    <tr key={row.ai_source} className="group relative">
                      <td className="py-2 pr-2 relative">
                        <div
                          className="absolute inset-y-0 left-0 rounded-sm transition-all duration-[400ms] ease-out group-hover:opacity-[0.18]"
                          style={{
                            width: `${(row.visitors / maxVisitors) * 100}%`,
                            background: 'var(--color-primary)',
                            opacity: 0.08,
                          }}
                        />
                        <span className="relative z-10 flex items-center gap-1.5 text-sm text-text-secondary">
                          <span>✨</span>
                          <span>{row.ai_source}</span>
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-right text-sm text-text-secondary relative z-10">
                        {row.visitors.toLocaleString()}
                      </td>
                      <td className="py-2 text-right text-sm text-text-tertiary relative z-10">
                        {row.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* AI Bot Traffic */}
      <div className="border border-border rounded-lg bg-bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-text-primary">
            AI Bot visits
          </h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-text-tertiary">
            excluded from main metrics
          </span>
        </div>
        <p className="text-xs text-text-tertiary mb-3">
          AI bots fetching your content to answer queries
        </p>

        {botSources.length === 0 ? (
          <p className="text-sm text-text-tertiary py-4">No AI bot visits detected yet</p>
        ) : (
          <div className="space-y-1">
            {botSources.map(bot => (
              <div key={bot.ai_source} className="flex justify-between py-1.5 text-sm">
                <span className="text-text-secondary">{bot.ai_source}</span>
                <span className="text-text-tertiary tabular-nums">{bot.pageviews.toLocaleString()} fetches</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
