import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // 1. Create authenticated client to verify session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
             // API routes should not generally set auth cookies passively
          },
        },
      }
    );

    // 2. Authorize User
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 3. Process FormData File
    const formData = await req.formData();
    // Support both 'avatar' and 'file' payload keys just in case
    const file = (formData.get("avatar") || formData.get("file")) as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 2MB limit" }, { status: 400 });
    }

    // Convert file to buffer for Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // File Path structure: {auth_user_id}/timestamp-filename (prevent collision)
    const fileExt = file.name.split('.').pop();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const filePath = `${user.id}/${Date.now()}-${safeFilename}`;

    // 4. Upload to "agent_avatars" storage bucket using Service Role (Bypassing restrictive client RLS just in case)
    const adminSupabase = createServiceRoleSupabaseClient();
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from("agent_avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
    }

    // 5. Get Public URL
    const { data: publicUrlData } = adminSupabase.storage
      .from("agent_avatars")
      .getPublicUrl(uploadData.path);

    const publicUrl = publicUrlData.publicUrl;

    // 6. Update agent_users table
    const { error: dbError } = await adminSupabase
      .from("agent_users")
      .update({ avatar_url: publicUrl })
      .eq("auth_user_id", user.id);

    if (dbError) {
      console.error("DB update error:", dbError);
      return NextResponse.json({ error: "Failed to update profile record" }, { status: 500 });
    }

    // Success
    return NextResponse.json({ url: publicUrl, success: true });

  } catch (error: any) {
    console.error("Critical upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
