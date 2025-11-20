import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("credentials")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({ credentials: data || {} })
  } catch (error: any) {
    console.error("Error fetching credentials:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch credentials" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { xai_api_key, wordpress_url, wordpress_username, wordpress_app_password } = body

    // Check if credentials already exist
    const { data: existing } = await supabaseAdmin
      .from("credentials")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (existing) {
      // Update existing credentials
      const { data, error } = await supabaseAdmin
        .from("credentials")
        .update({
          xai_api_key,
          wordpress_url,
          wordpress_username,
          wordpress_app_password,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, credentials: data })
    } else {
      // Insert new credentials
      const { data, error } = await supabaseAdmin
        .from("credentials")
        .insert([
          {
            user_id: session.user.id,
            xai_api_key,
            wordpress_url,
            wordpress_username,
            wordpress_app_password,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, credentials: data })
    }
  } catch (error: any) {
    console.error("Error saving credentials:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save credentials" },
      { status: 500 }
    )
  }
}
