import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      api_key,
      visitor_id,
      session_id,
      event_name,
      properties,
      path,
      referrer,
      source,
      device,
      browser,
      country
    } = body

    // Validate required fields
    if (!api_key || !visitor_id || !event_name) {
      return NextResponse.json(
        { error: 'Missing required fields: api_key, visitor_id, event_name' },
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

    // Validate domain (security: prevent API key abuse)
    const origin = request.headers.get('referer') || request.headers.get('origin')
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        const siteDomain = site.domain.replace(/^www\./, '')

        // Temporary debug logging
        console.log('[Track Event API Debug]', {
          origin,
          originHostname,
          siteDomain,
          siteId: site.id,
          apiKey: api_key.substring(0, 8) + '...'
        })

        // Allow localhost for development
        const isLocalhost = originHostname === 'localhost' || originHostname === '127.0.0.1' || originHostname.endsWith('.localhost')

        if (!isLocalhost && !originHostname.endsWith(siteDomain) && originHostname !== siteDomain) {
          console.error('[Track Event API] Domain validation failed', { originHostname, siteDomain })
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

    const site_id = site.id

    // Insert custom event
    const { error } = await supabase
      .from('custom_events')
      .insert({
        site_id,
        visitor_id,
        session_id: session_id || null,
        event_name,
        properties: properties || {},
        path: path || null,
        referrer: referrer || null,
        source: source || 'Direct',
        device: device || null,
        browser: browser || null,
        country: country || null,
        timestamp: new Date().toISOString()
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Custom event tracking error:', error)
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
