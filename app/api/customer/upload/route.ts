import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { readCustomerSession } from '@/lib/customer-session'

export async function POST(request: NextRequest) {
  const session = await readCustomerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG and PDF files are allowed' }, { status: 400 })
    }

    const supabase = createServiceRoleSupabaseClient()
    
    // Generate unique file path: customerId/timestamp_filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `customers/${session.customerId}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ticket_attachments')
      .upload(filePath, file, { upsert: false })

    if (uploadError) throw uploadError

    const { data: publicData } = supabase.storage
      .from('ticket_attachments')
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      url: publicData.publicUrl,
      type: file.type,
      name: file.name,
      size: file.size
    })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
