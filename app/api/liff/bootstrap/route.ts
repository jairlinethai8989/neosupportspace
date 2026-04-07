import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { issueCustomerSession } from '@/lib/customer-session'

/**
 * Validation schema for LIFF bootstrap/registration.
 */
const bootstrapSchema = z.object({
  lineUserId: z.string().min(1, 'LINE User ID is required'),
  displayName: z.string().optional(),
  hospitalCode: z.string().min(1, 'Hospital code is required'),
  fullName: z.string().min(2, 'Full name is too short'),
  phone: z.string().min(9, 'Phone number is invalid'),
  department: z.string().optional(),
})

/**
 * API handler to register a customer from a LIFF app session.
 * 1. Validates input
 * 2. Checks hospital by code
 * 3. Upserts customer_user record
 * 4. Issues signed HTTP-only session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = bootstrapSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { lineUserId, displayName, hospitalCode, fullName, phone, department } = validation.data
    const supabase = createServiceRoleSupabaseClient()

    // 1. Find hospital by code
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id')
      .eq('code', hospitalCode.toUpperCase())
      .single()

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { error: 'Hospital code not found. Please check and try again.' },
        { status: 400 }
      )
    }

    // 2. Upsert customer_user
    const { data: customer, error: customerError } = await supabase
      .from('customer_users')
      .upsert(
        {
          line_user_id: lineUserId,
          display_name: displayName,
          full_name: fullName,
          phone: phone,
          department: department,
          hospital_id: hospital.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'line_user_id' }
      )
      .select()
      .single()

    if (customerError || !customer) {
      console.error('Customer upsert error:', customerError)
      return NextResponse.json(
        { error: 'Failed to save customer profile.' },
        { status: 500 }
      )
    }

    // 3. Issue session cookie (HTTP-only)
    await issueCustomerSession({
      lineUserId: customer.line_user_id,
      customerId: customer.id,
      hospitalId: hospital.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      customerId: customer.id,
    })
  } catch (err) {
    console.error('LIFF Bootstrap error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
