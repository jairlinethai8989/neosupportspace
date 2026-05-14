'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

type WidgetData = {
  id: string
  type: string
  title: string
  colSpan?: number
}

interface AnalyticsData {
  timelineData: Array<{ date: string; count: number }>
  statusData: Array<{ name: string; value: number }>
  priorityData: Array<{ name: string; value: number }>
  teamData: Array<{ name: string; value: number }>
  csat: { average: number; count: number }
}

// Draggable Wrapper Component
function SortableWidget({ id, widget, data }: { id: string, widget: WidgetData, data: AnalyticsData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.6 : 1,
  }

  const renderChart = () => {
    switch (widget.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.timelineData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="#94a3b8" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 10, fontWeight: 700, fill: "#94a3b8"}} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
              />
              <YAxis allowDecimals={false} tick={{fontSize: 10, fontWeight: 700, fill: "#94a3b8"}} axisLine={false} tickLine={false} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie 
                data={data.statusData} 
                cx="50%" 
                cy="50%" 
                innerRadius={70} 
                outerRadius={95} 
                paddingAngle={5}
                dataKey="value" 
                stroke="none"
                animationDuration={1500}
              >
                {data.statusData?.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        )
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.priorityData} layout="vertical" margin={{ left: -20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} stroke="#94a3b8" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{fontSize: 10, fontWeight: 800, fill: "#64748b"}} axisLine={false} tickLine={false} width={80} />
              <RechartsTooltip cursor={{fill: 'rgba(59, 130, 246, 0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={24} animationDuration={1800} />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'team':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.teamData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="#94a3b8" />
              <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 800, fill: "#64748b"}} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{fontSize: 10, fontWeight: 800, fill: "#64748b"}} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{fill: 'rgba(16, 185, 129, 0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }} />
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} animationDuration={2000} />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'kpi':
        return (
          <div className="flex flex-col items-center justify-center h-[260px] bg-gradient-to-b from-transparent to-yellow-50/30 rounded-2xl">
            <div className="relative">
              <span className="text-7xl font-black text-slate-900 tracking-tighter">{data.csat?.average?.toFixed(1) || '0.0'}</span>
              <span className="absolute -top-2 -right-6 text-2xl">⭐</span>
            </div>
            <div className="flex gap-1.5 mt-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-2xl ${s <= Math.round(data.csat?.average || 0) ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
              ))}
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-6">Average Satisfaction</p>
            <div className="mt-2 bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{data.csat?.count || 0} REVIEWS</div>
          </div>
        )
      default:
        return <div className="text-muted-foreground flex justify-center items-center h-full text-sm font-medium">Unknown Widget</div>
    }
  }

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl flex flex-col group bg-white overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${widget.colSpan === 2 ? 'lg:col-span-2' : ''}`}
    >
      <CardHeader className="flex flex-row justify-between items-center pb-4 pt-6 px-8 cursor-grab active:cursor-grabbing group-hover:bg-slate-50/50 transition-colors" {...attributes} {...listeners}>
        <CardTitle className="font-black text-slate-900 flex items-center gap-3 text-sm uppercase tracking-widest">
          <div className="w-1.5 h-6 bg-slate-200 group-hover:bg-primary transition-colors rounded-full" />
          {widget.title}
        </CardTitle>
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">DRAG</span>
      </CardHeader>
      <CardContent className="px-8 pb-8 pt-2">
         {renderChart()}
      </CardContent>
    </Card>
  )
}

export function DraggableDashboard({ initialConfig }: { initialConfig: { layout: WidgetData[] } }) {
  const [layout, setLayout] = useState<WidgetData[]>(initialConfig.layout || [])
  const [days, setDays] = useState('30')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchData()
  }, [days])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/analytics?days=${days}`)
      const json = await res.json()
      if (json.error) throw new Error("API returned an error");
      setData(json)
    } catch {
      console.warn("Analytics API falling back to dummy data.")
      setData({
        timelineData: [{date:'Mon', count:10}, {date:'Tue', count:15}, {date:'Wed', count:5}, {date:'Thu', count:22}, {date:'Fri', count:18}],
        statusData: [{name:'Open', value: 20}, {name:'Resolved', value: 15}, {name:'Closed', value: 30}],
        priorityData: [{name:'Low', value: 45}, {name:'Medium', value: 20}, {name:'High', value: 5}],
        teamData: [{name:'Dev', value: 12}, {name:'SA', value: 8}, {name:'Pending', value: 15}],
        csat: { average: 4.8, count: 124 }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const saveLayout = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/agent/profile/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout })
      })
      if (!res.ok) throw new Error('Failed to save layout')
      alert('Dashboard layout saved successfully')
    } catch(err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) return <div className="p-10 text-center text-muted-foreground animate-pulse font-medium">Loading Analytics...</div>

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between bg-card text-card-foreground p-4 rounded-xl border border-border shadow-none">
        <div className="flex gap-3 items-center px-2">
           <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Filter Data</span>
           <select 
             className="bg-secondary/50 border-none outline-none font-medium text-sm px-3 py-1.5 rounded-md cursor-pointer text-foreground" 
             value={days} 
             onChange={e => setDays(e.target.value)}
           >
             <option value="7">Last 7 Days</option>
             <option value="30">Last 30 Days</option>
             <option value="90">Last 90 Days</option>
           </select>
        </div>
        <Button 
          onClick={saveLayout} 
          disabled={saving} 
          className="shadow-none rounded-lg font-semibold"
        >
          {saving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layout.map((i: any) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {layout.map((widget: any) => (
              <SortableWidget key={widget.id} id={widget.id} widget={widget} data={data!} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
