import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { generateVisitorId, parseUserAgent, extractDomain } from '@/lib/utils'

// Enable Vercel Edge Runtime for automatic geolocation
export const runtime = 'edge'

/**
 * POST /api/track
 * Receives pageview events from the tracking script
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { api_key, path, referrer, user_agent } = body

    // Validate required fields
    if (!api_key || !path) {
      return NextResponse.json(
        { error: 'Missing required fields: api_key, path' },
        { status: 400 }
      )
    }

    // Get service role Supabase client (bypasses RLS)
    const supabase = getServiceSupabase()

    // Verify API key and get site_id
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id')
      .eq('api_key', api_key)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Get visitor IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    // Generate visitor ID (hash of IP + User Agent)
    const visitorId = generateVisitorId(ip, user_agent || '')

    // Parse user agent
    const { browser, os, device } = parseUserAgent(user_agent || '')

    // Extract referrer domain
    const referrerDomain = extractDomain(referrer)

    // Get geolocation from Vercel Edge Runtime
    // Note: request.geo is only available in production on Vercel
    // In development, these will be undefined
    const country = request.geo?.country || null
    const city = request.geo?.city || null
    const region = request.geo?.region || null

    // Insert pageview
    const { error: insertError } = await supabase
      .from('pageviews')
      .insert({
        site_id: site.id,
        visitor_id: visitorId,
        path,
        referrer: referrerDomain,
        user_agent,
        browser,
        device,
        os,
        country,
        city,
        region,
      })

    if (insertError) {
      console.error('Error inserting pageview:', insertError)
      return NextResponse.json(
        { error: 'Failed to track pageview' },
        { status: 500 }
      )
    }

    // Success
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Track API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS preflight (handled by middleware)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': origin ? 'true' : 'false',
    },
  })
}
