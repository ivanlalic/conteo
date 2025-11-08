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
      event_type, // Only 'purchase' events are tracked
      product_id,
      product_name,
      product_page,
      value,
      currency,
      source
    } = body

    // Validate required fields
    if (!api_key || !visitor_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Only track purchase events
    if (event_type !== 'purchase') {
      return NextResponse.json({ success: true, message: 'Event ignored - only purchases are tracked' })
    }

    // Verify API key and get site_id
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, domain, cod_tracking_enabled')
      .eq('api_key', api_key)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Validate domain (security: prevent API key abuse)
    const referer = request.headers.get('referer') || request.headers.get('origin')
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const refererHostname = refererUrl.hostname.replace(/^www\./, '') // Remove www.
        const siteDomain = site.domain.replace(/^www\./, '') // Remove www.

        // Allow localhost for development
        const isLocalhost = refererHostname === 'localhost' || refererHostname === '127.0.0.1' || refererHostname.endsWith('.localhost')

        // Check if referer matches site domain (allow subdomains) or is localhost
        if (!isLocalhost && !refererHostname.endsWith(siteDomain) && refererHostname !== siteDomain) {
          return NextResponse.json(
            { error: 'Invalid domain' },
            { status: 403 }
          )
        }
      } catch (e) {
        // Invalid URL in referer, reject request
        return NextResponse.json(
          { error: 'Invalid referer' },
          { status: 403 }
        )
      }
    }

    // Check if COD tracking is enabled for this site
    if (!site.cod_tracking_enabled) {
      return NextResponse.json(
        { success: true, message: 'COD tracking not enabled' },
        { status: 200 }
      )
    }

    const site_id = site.id

    // Insert conversion record (purchase only)
    const { error } = await supabase
      .from('cod_conversions')
      .insert({
        site_id,
        visitor_id,
        product_name: product_name || 'Unknown',
        product_id: product_id || '',
        product_page: product_page || '',
        viewed_product: true,
        opened_form: true,
        purchased: true,
        value: value || 0,
        currency: currency || 'EUR',
        source: source || 'Direct',
        purchased_at: new Date().toISOString()
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('COD tracking error:', error)
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
