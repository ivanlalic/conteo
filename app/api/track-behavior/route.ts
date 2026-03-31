import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const VALID_EVENT_TYPES = ['rage_click', 'dead_click', 'excessive_scroll', 'quick_back']

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Empty request body' },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { api_key, events } = body

    if (!api_key || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: api_key, events (array)' },
        { status: 400 }
      )
    }

    // Verify API key and get site_id
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, domain')
      .eq('api_key', api_key)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Validate domain
    const origin = request.headers.get('referer') || request.headers.get('origin')
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        const siteDomain = site.domain.replace(/^www\./, '')
        const isLocalhost = originHostname === 'localhost' || originHostname === '127.0.0.1' || originHostname.endsWith('.localhost')

        if (!isLocalhost && !originHostname.endsWith(siteDomain) && originHostname !== siteDomain) {
          return NextResponse.json(
            { error: 'Invalid domain' },
            { status: 403 }
          )
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid origin' },
          { status: 403 }
        )
      }
    }

    // Validate and prepare rows
    const rows = events
      .filter((evt: any) => VALID_EVENT_TYPES.includes(evt.event_type))
      .slice(0, 50) // Cap at 50 events per batch
      .map((evt: any) => ({
        site_id: site.id,
        visitor_id: evt.visitor_id || '',
        session_id: evt.session_id || '',
        event_type: evt.event_type,
        page_url: evt.page_url || '',
        event_data: evt.event_data || {},
        device_type: evt.device_type || null,
      }))

    if (rows.length === 0) {
      return NextResponse.json({ success: true, inserted: 0 })
    }

    const { error } = await supabase
      .from('behavior_events')
      .insert(rows)

    if (error) throw error

    return NextResponse.json({ success: true, inserted: rows.length })
  } catch (error: any) {
    console.error('Behavior tracking error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
