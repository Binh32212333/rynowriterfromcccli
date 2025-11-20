import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { generateContent } from "@/lib/xai"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { keywords } = await request.json()

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "Keywords array is required" },
        { status: 400 }
      )
    }

    // Get user's credentials
    const { data: credData, error: credError } = await supabaseAdmin
      .from("credentials")
      .select("xai_api_key")
      .eq("user_id", session.user.id)
      .single()

    if (credError || !credData?.xai_api_key) {
      return NextResponse.json(
        { error: "Please configure your xAI API key in Settings" },
        { status: 400 }
      )
    }

    // Create batch job
    const { data: batchJob, error: batchError } = await supabaseAdmin
      .from("batch_jobs")
      .insert([
        {
          user_id: session.user.id,
          total_items: keywords.length,
          completed_items: 0,
          status: "processing",
        },
      ])
      .select()
      .single()

    if (batchError) {
      return NextResponse.json(
        { error: "Failed to create batch job" },
        { status: 500 }
      )
    }

    // Process all keywords (in a real app, this should be a background job)
    // For now, we'll process them sequentially with a limit
    const maxBatchSize = 10
    const keywordsToProcess = keywords.slice(0, maxBatchSize)
    let successCount = 0
    let failCount = 0

    for (const keyword of keywordsToProcess) {
      try {
        const generatedContent = await generateContent({
          apiKey: credData.xai_api_key,
          keywords: keyword,
        })

        await supabaseAdmin.from("content").insert([
          {
            user_id: session.user.id,
            title: generatedContent.title,
            body: generatedContent.body,
            keywords: keyword,
            status: "generated",
            metadata: {
              metaDescription: generatedContent.metaDescription,
              tags: generatedContent.tags,
              categories: generatedContent.categories,
              batchJobId: batchJob.id,
            },
          },
        ])

        successCount++
      } catch (error) {
        console.error(`Error processing keyword "${keyword}":`, error)
        failCount++
      }

      // Update batch job progress
      await supabaseAdmin
        .from("batch_jobs")
        .update({
          completed_items: successCount + failCount,
        })
        .eq("id", batchJob.id)
    }

    // Update final batch job status
    await supabaseAdmin
      .from("batch_jobs")
      .update({
        status: failCount === keywordsToProcess.length ? "failed" : "completed",
        completed_items: successCount + failCount,
      })
      .eq("id", batchJob.id)

    return NextResponse.json({
      success: true,
      batchJob,
      processed: keywordsToProcess.length,
      successCount,
      failCount,
      message:
        keywords.length > maxBatchSize
          ? `Processed ${maxBatchSize} of ${keywords.length} keywords. Consider processing in smaller batches.`
          : undefined,
    })
  } catch (error: any) {
    console.error("Error in batch processing:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process batch" },
      { status: 500 }
    )
  }
}
