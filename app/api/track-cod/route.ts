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
      event_type, // 'product_view', 'initiate_checkout', 'purchase'
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

    // Verify API key and get site_id
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, cod_tracking_enabled')
      .eq('api_key', api_key)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Check if COD tracking is enabled for this site
    if (!site.cod_tracking_enabled) {
      return NextResponse.json(
        { success: true, message: 'COD tracking not enabled' },
        { status: 200 }
      )
    }

    const site_id = site.id

    // Handle different event types
    if (event_type === 'product_view') {
      // Create or update conversion record
      const { error } = await supabase
        .from('cod_conversions')
        .upsert(
          {
            site_id,
            visitor_id,
            product_name: product_name || 'Unknown',
            product_page: product_page || '',
            viewed_product: true,
            source: source || 'Direct',
            product_view_at: new Date().toISOString()
          },
          {
            onConflict: 'visitor_id,site_id',
            ignoreDuplicates: false
          }
        )

      if (error) throw error
    } else if (event_type === 'initiate_checkout') {
      // Find existing record or create new one
      const { data: existing } = await supabase
        .from('cod_conversions')
        .select('*')
        .eq('site_id', site_id)
        .eq('visitor_id', visitor_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('cod_conversions')
          .update({
            product_name: product_name || existing.product_name || 'Unknown',
            product_id: product_id || existing.product_id,
            product_page: product_page || existing.product_page,
            viewed_product: true, // If they opened form, they viewed the product
            opened_form: true,
            form_opened_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Create new record
        const { error } = await supabase
          .from('cod_conversions')
          .insert({
            site_id,
            visitor_id,
            product_name: product_name || 'Unknown',
            product_id: product_id || '',
            product_page: product_page || '',
            viewed_product: true, // If they opened form, they viewed the product
            opened_form: true,
            source: source || 'Direct',
            form_opened_at: new Date().toISOString()
          })

        if (error) throw error
      }
    } else if (event_type === 'purchase') {
      // Find the most recent conversion for this visitor
      const { data: existing } = await supabase
        .from('cod_conversions')
        .select('*')
        .eq('site_id', site_id)
        .eq('visitor_id', visitor_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        // Update existing record with purchase
        const { error } = await supabase
          .from('cod_conversions')
          .update({
            viewed_product: true, // If they purchased, they viewed the product
            opened_form: true, // If they purchased, they opened the form
            purchased: true,
            value: value || 0,
            currency: currency || 'EUR',
            purchased_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Create new record with purchase (fallback)
        const { error } = await supabase
          .from('cod_conversions')
          .insert({
            site_id,
            visitor_id,
            product_name: product_name || 'Unknown',
            product_page: product_page || '',
            viewed_product: true, // If they purchased, they viewed the product
            opened_form: true, // If they purchased, they opened the form
            purchased: true,
            value: value || 0,
            currency: currency || 'EUR',
            source: source || 'Direct',
            purchased_at: new Date().toISOString()
          })

        if (error) throw error
      }
    }

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
