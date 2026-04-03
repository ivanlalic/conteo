import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper: get authenticated user from request
async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// Helper: verify site ownership
async function verifySiteOwnership(siteId: string, userId: string) {
  const { data } = await supabase
    .from('sites')
    .select('id')
    .eq('id', siteId)
    .eq('user_id', userId)
    .single()
  return !!data
}

// GET — list goals for a site
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const siteId = request.nextUrl.searchParams.get('site_id')
    if (!siteId) return NextResponse.json({ error: 'Missing site_id' }, { status: 400 })

    const owns = await verifySiteOwnership(siteId, user.id)
    if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST — create a goal
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    if (!body.site_id || !body.goal_type || !body.display_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const owns = await verifySiteOwnership(body.site_id, user.id)
    if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (body.goal_type === 'pageview' && !body.page_path) {
      return NextResponse.json({ error: 'Pageview goal requires page_path' }, { status: 400 })
    }

    if (body.goal_type === 'custom_event' && !body.event_name) {
      return NextResponse.json({ error: 'Event goal requires event_name' }, { status: 400 })
    }

    // Limit: max 20 goals per site
    const { count } = await supabase
      .from('goals')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', body.site_id)

    if (count !== null && count >= 20) {
      return NextResponse.json({ error: 'Maximum 20 goals per site' }, { status: 400 })
    }

    const { data, error } = await supabase.from('goals').insert({
      site_id: body.site_id,
      goal_type: body.goal_type,
      display_name: body.display_name.substring(0, 128),
      page_path: body.page_path?.substring(0, 512) || null,
      match_type: body.match_type || 'exact',
      event_name: body.event_name?.substring(0, 64) || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE — remove a goal
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const goalId = request.nextUrl.searchParams.get('id')
    if (!goalId) return NextResponse.json({ error: 'Missing goal id' }, { status: 400 })

    // Verify ownership via the goal's site
    const { data: goal } = await supabase
      .from('goals')
      .select('site_id')
      .eq('id', goalId)
      .single()

    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    const owns = await verifySiteOwnership(goal.site_id, user.id)
    if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
