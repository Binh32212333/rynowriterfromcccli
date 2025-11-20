import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentId } = await request.json()

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from("content")
      .delete()
      .eq("id", contentId)
      .eq("user_id", session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting content:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete content" },
      { status: 500 }
    )
  }
}
