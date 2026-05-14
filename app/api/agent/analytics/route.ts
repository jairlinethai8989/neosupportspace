import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30', 10)

  const supabaseAdmin = createServiceRoleSupabaseClient()
  
  const dateLimit = new Date()
  dateLimit.setDate(dateLimit.getDate() - days)

  // Fetch tickets for aggregation
  const { data: tickets, error } = await supabaseAdmin
    .from('tickets')
    .select('status, priority, created_at, csat_score, assigned_team')
    .gte('created_at', dateLimit.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  interface AggStats {
    status: Record<string, number>
    priority: Record<string, number>
    team: Record<string, number>
    timeline: Record<string, number>
    csat: { total: number; count: number; average: number }
  }

  const stats: AggStats = {
    status: {},
    priority: {},
    team: {},
    timeline: {},
    csat: { total: 0, count: 0, average: 0 }
  }

  tickets?.forEach((t: { status: string; priority: string; created_at: string; csat_score: number | null; assigned_team: string | null }) => {
    // Status
    stats.status[t.status] = (stats.status[t.status] || 0) + 1
    
    // Priority
    stats.priority[t.priority] = (stats.priority[t.priority] || 0) + 1

    // Team
    const team = t.assigned_team || 'support'
    stats.team[team] = (stats.team[team] || 0) + 1

    // Timeline
    const d = new Date(t.created_at).toLocaleDateString('en-CA') // YYYY-MM-DD
    stats.timeline[d] = (stats.timeline[d] || 0) + 1

    // CSAT
    if (t.csat_score) {
      stats.csat.total += t.csat_score
      stats.csat.count += 1
    }
  })

  if (stats.csat.count > 0) {
    stats.csat.average = stats.csat.total / stats.csat.count
  }

  // Format array for Recharts
  const statusData = Object.keys(stats.status).map((k: string) => ({ name: k.replace('_', ' ').toUpperCase(), value: (stats.status as any)[k] }))
  const priorityData = Object.keys(stats.priority).map((k: string) => ({ name: k.toUpperCase(), value: (stats.priority as any)[k] }))
  const teamData = Object.keys(stats.team).map((k: string) => ({ name: k.toUpperCase(), value: (stats.team as any)[k] }))
  
  // Sort timeline chronologically
  const timelineData = Object.keys(stats.timeline).sort().map((k: string) => ({ date: k, count: (stats.timeline as any)[k] }))

  return NextResponse.json({ statusData, priorityData, teamData, timelineData, csat: stats.csat })
}
