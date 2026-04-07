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
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

type WidgetData = {
  id: string
  type: string
  title: string
  colSpan?: number
}

// Draggable Wrapper Component
function SortableWidget({ id, widget, data }: { id: string, widget: WidgetData, data: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  const renderChart = () => {
    switch (widget.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" tick={{fontSize: 10}} />
              <YAxis allowDecimals={false} tick={{fontSize: 10}} />
              <RechartsTooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.statusData} cx="50%" cy="50%" labelLine={false} innerRadius={60} outerRadius={80} fill="#8884d8" dataKey="value" stroke="none">
                {data.statusData?.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.priorityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" tick={{fontSize: 10}} />
              <YAxis allowDecimals={false} tick={{fontSize: 10}} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'kpi':
        return (
          <div className="flex flex-col items-center justify-center h-[250px]">
            <span className="text-6xl font-black text-yellow-500 drop-shadow-sm">{data.csat?.average?.toFixed(1) || '0.0'}</span>
            <div className="flex gap-1 mt-2 text-yellow-400 text-xl">{'★'.repeat(Math.round(data.csat?.average || 0))}</div>
            <p className="text-gray-400 text-sm mt-3 font-medium">{data.csat?.count} Ratings Total</p>
          </div>
        )
      default:
        return <div>Unknown Widget</div>
    }
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 group ${widget.colSpan === 2 ? 'lg:col-span-2' : ''}`}
    >
      <div className="flex justify-between items-center cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <span className="text-gray-300 opacity-50 group-hover:opacity-100 transition-opacity">⠿</span> {widget.title}
        </h3>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">{widget.type}</div>
      </div>
      <div>{renderChart()}</div>
    </div>
  )
}

export function DraggableDashboard({ initialConfig }: { initialConfig: any }) {
  const [layout, setLayout] = useState<WidgetData[]>(initialConfig.layout || [])
  const [days, setDays] = useState('30')
  const [data, setData] = useState<any>(null)
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
      setData(json)
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
      if (!res.ok) throw new Error('บันทึกไม่สำเร็จ')
      alert('บันทึกรูปแบบหน้าจอเรียบร้อยแล้ว')
    } catch(err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) return <div className="p-10 text-center text-gray-500">Loading Analytics...</div>

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-2 items-center">
           <span className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Filter Data:</span>
           <select className="bg-gray-50 border-none outline-none font-bold text-sm p-2 rounded-xl" value={days} onChange={e => setDays(e.target.value)}>
             <option value="7">Last 7 Days</option>
             <option value="30">Last 30 Days</option>
             <option value="90">Last 90 Days</option>
           </select>
        </div>
        <button onClick={saveLayout} disabled={saving} className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 text-sm">
          {saving ? 'Saving...' : 'Save Current Layout'}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layout.map(i => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {layout.map(widget => (
              <SortableWidget key={widget.id} id={widget.id} widget={widget} data={data} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
