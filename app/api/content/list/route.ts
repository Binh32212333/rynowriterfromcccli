import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: content, error } = await supabaseAdmin
      .from("content")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching content:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      count: content?.length || 0,
      content: content || []
    })
  } catch (error: any) {
    console.error("Error in list route:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch content" },
      { status: 500 }
    )
  }
}
