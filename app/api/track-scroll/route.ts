import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const VALID_MILESTONES = [25, 50, 75, 100]

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
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { api_key, visitor_id, path, scroll_depth } = body

    if (!api_key || !visitor_id || !path) {
      return NextResponse.json(
        { error: 'Missing required fields: api_key, visitor_id, path' },
        { status: 400 }
      )
    }

    const milestone = Number(scroll_depth)
    if (!VALID_MILESTONES.includes(milestone)) {
      return NextResponse.json(
        { error: 'Invalid scroll_depth. Must be 25, 50, 75, or 100' },
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

    const { error } = await supabase
      .from('scroll_events')
      .insert({
        site_id: site.id,
        visitor_id: visitor_id,
        path: path,
        scroll_depth: milestone,
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Scroll depth tracking error:', error)
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
