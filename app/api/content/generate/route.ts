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

    const { keywords, generationMode } = await request.json()

    if (!keywords) {
      return NextResponse.json(
        { error: "Keywords are required" },
        { status: 400 }
      )
    }

    // Map generation mode to settings
    let budgetMode = false
    let useCheaperModel = false
    let skipEnhanced = true
    let imageCount = 1
    let contentLength = 1000

    if (generationMode === "best-quality") {
      budgetMode = false
      useCheaperModel = false
      skipEnhanced = false
      imageCount = 5
      contentLength = 1000
    } else if (generationMode === "normal") {
      budgetMode = false
      useCheaperModel = false
      skipEnhanced = true
      imageCount = 1
      contentLength = 1000
    } else if (generationMode === "most-saving") {
      budgetMode = true
      useCheaperModel = true
      skipEnhanced = true
      imageCount = 1
      contentLength = 800
    } else {
      // Fallback to .env.local settings if no mode specified
      budgetMode = process.env.BUDGET_MODE === 'true'
      useCheaperModel = process.env.USE_CHEAPER_MODEL === 'true'
      skipEnhanced = process.env.SKIP_ENHANCED_IMAGES === 'true'
      imageCount = parseInt(process.env.IMAGE_COUNT || '5')
      contentLength = budgetMode ? 800 : 1000
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

    console.log(`💰 Mode: ${generationMode || 'env-based'} | Budget: ${budgetMode} | Model: ${useCheaperModel ? 'grok-3-mini' : 'grok-4-0709'} | Images: ${imageCount}`)

    // Generate content using xAI
    const generatedContent = await generateContent({
      apiKey: credData.xai_api_key,
      keywords,
      contentType: 'blog post',
      tone: 'professional',
      length: contentLength,
      model: useCheaperModel ? 'grok-3-mini' : 'grok-4-0709',
    })

    // Intelligent image generation with automatic strategy selection
    let featuredImageUrl: string | null = null
    let generatedImages: any[] = []
    try {
      console.log("🤖 Starting intelligent image generation for:", generatedContent.title)
      console.log(`💰 Image settings - Count: ${imageCount}, Skip Enhanced: ${skipEnhanced}`)

      const {
        shouldUseEnhancedImageGeneration,
        generateMultipleEnhancedImages,
        generateMultipleImages
      } = await import("@/lib/xai")

      let useEnhanced = false

      // Step 1: Decide strategy (skip in budget mode)
      if (!budgetMode && !skipEnhanced) {
        console.log("📊 Analyzing keyword complexity...")
        const decision = await shouldUseEnhancedImageGeneration(
          credData.xai_api_key,
          keywords,
          generatedContent.title
        )
        useEnhanced = decision.useEnhanced
        console.log(`💡 Agent decision: ${decision.useEnhanced ? 'ENHANCED' : 'STANDARD'}`)
        console.log(`💡 Reason: ${decision.reasoning}`)
      } else {
        console.log("💰 Budget mode: Skipping agent decision, using STANDARD workflow")
      }

      // Step 2: Generate images based on strategy
      if (useEnhanced && !skipEnhanced) {
        console.log("🔍 Using ENHANCED workflow: Bright Data SERP → xAI Vision → xAI Image Generation")
        generatedImages = await generateMultipleEnhancedImages(
          credData.xai_api_key,
          generatedContent.title,
          keywords,
          imageCount
        )
      } else {
        console.log("⚡ Using STANDARD workflow: Direct xAI Image Generation")
        generatedImages = await generateMultipleImages(
          credData.xai_api_key,
          generatedContent.title,
          generatedContent.body,
          imageCount
        )
      }

      // Use first image as featured image
      if (generatedImages.length > 0) {
        featuredImageUrl = generatedImages[0].url
      }

      console.log(`✅ Successfully generated ${generatedImages.length} images`)
    } catch (imageError: any) {
      console.error("❌ Error generating images:", imageError)
      // Continue without images if generation fails
    }

    // Calculate token stats
    const tokenStats = {
      content: generatedContent.tokenUsage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      imageCount: generatedImages.length,
      workflow: generationMode === 'best-quality' ? 'premium' :
                generationMode === 'most-saving' ? 'budget' :
                generationMode === 'normal' ? 'standard' :
                (budgetMode ? 'budget' : (skipEnhanced ? 'standard' : 'smart')),
      model: useCheaperModel ? 'grok-3-mini' : 'grok-4-0709',
    }

    console.log('📊 Token usage:', tokenStats)

    // Save to database
    const { data: content, error: insertError } = await supabaseAdmin
      .from("content")
      .insert([
        {
          user_id: session.user.id,
          title: generatedContent.title,
          body: generatedContent.body,
          keywords,
          featured_image_url: featuredImageUrl,
          status: "generated",
          metadata: {
            metaDescription: generatedContent.metaDescription,
            tags: generatedContent.tags,
            categories: generatedContent.categories,
            images: generatedImages, // Store all 5 images with alt tags
            tokenStats, // Store token usage statistics
          },
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Error saving content:", insertError)
      return NextResponse.json(
        { error: "Failed to save content" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, content })
  } catch (error: any) {
    console.error("Error generating content:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    )
  }
}
