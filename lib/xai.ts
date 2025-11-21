export interface GenerateContentParams {
  apiKey: string
  keywords: string
  contentType?: string
  tone?: string
  length?: number
  model?: 'grok-beta' | 'grok-2-latest'
}

export interface GenerateImageParams {
  apiKey: string
  prompt: string
  size?: string
}

export interface ImageWithAlt {
  url: string
  alt: string
  prompt: string
}

export interface GeneratedContent {
  title: string
  body: string
  metaDescription?: string
  tags?: string[]
  categories?: string[]
  tokenUsage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function generateContent(
  params: GenerateContentParams
): Promise<GeneratedContent> {
  const { apiKey, keywords, contentType = 'blog post', tone = 'professional', length = 1000, model: paramModel } = params

  // Use provided model or fallback to environment variable or default
  const model = paramModel || (process.env.USE_CHEAPER_MODEL === 'true' ? 'grok-2-latest' : 'grok-beta')

  console.log(`📝 Generating content with model: ${model}`)

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are an expert content writer. Generate high-quality, SEO-optimized ${contentType} content in a ${tone} tone. Return ONLY a valid JSON object with the following structure:
{
  "title": "engaging title",
  "body": "full article content in HTML format",
  "metaDescription": "brief description for SEO",
  "tags": ["tag1", "tag2", "tag3"],
  "categories": ["category1"]
}`
          },
          {
            role: 'user',
            content: `Create a ${length}-word ${contentType} about: ${keywords}`
          }
        ],
        model: model,
        stream: false,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `xAI API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    const tokenUsage = data.usage // Capture token usage from API

    if (!content) {
      throw new Error('No content generated from xAI')
    }

    // Try to parse JSON from the response
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanedContent)
      return {
        ...parsed,
        tokenUsage // Add token usage to response
      }
    } catch (parseError) {
      // If parsing fails, return the raw content with a default structure
      return {
        title: keywords,
        body: content,
        metaDescription: keywords.substring(0, 160),
        tags: keywords.split(',').map((k: string) => k.trim()).slice(0, 5),
        categories: ['General'],
        tokenUsage
      }
    }
  } catch (error) {
    console.error('Error generating content:', error)
    throw error
  }
}

export async function generateImage(
  params: GenerateImageParams
): Promise<string> {
  const { apiKey, prompt } = params

  try {
    const response = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-vision-beta',
        prompt: prompt,
        n: 1,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `xAI Image API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()

    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('No image URL returned from xAI')
    }

    return data.data[0].url
  } catch (error) {
    console.error('Error generating image:', error)
    throw error
  }
}

export async function generateMultipleImages(
  apiKey: string,
  title: string,
  body: string,
  count: number = 5
): Promise<ImageWithAlt[]> {
  const images: ImageWithAlt[] = []

  // Generate image prompts based on article content
  const imagePrompts = [
    {
      prompt: `Professional hero image for article: "${title}". High-quality, engaging, photorealistic, 1280x720 aspect ratio, editorial style.`,
      alt: `Featured image for ${title}`
    },
    {
      prompt: `Supporting illustration for article about ${title}. Photorealistic, detailed, professional, 1280x720 aspect ratio.`,
      alt: `Detailed view related to ${title}`
    },
    {
      prompt: `Contextual image showing key concepts from: ${title}. Clear, informative, high-quality, 1280x720 aspect ratio.`,
      alt: `Key concepts illustration for ${title}`
    },
    {
      prompt: `Professional background image representing ${title}. Atmospheric, high-resolution, 1280x720 aspect ratio.`,
      alt: `Background illustration for ${title}`
    },
    {
      prompt: `Supplementary visual for ${title}. Engaging, clear, photorealistic, 1280x720 aspect ratio.`,
      alt: `Additional visual content for ${title}`
    }
  ]

  // Generate images one by one (xAI might rate limit parallel requests)
  for (let i = 0; i < Math.min(count, imagePrompts.length); i++) {
    try {
      console.log(`Generating image ${i + 1}/${count}:`, imagePrompts[i].prompt.substring(0, 60) + '...')
      const url = await generateImage({
        apiKey,
        prompt: imagePrompts[i].prompt,
      })

      images.push({
        url,
        alt: imagePrompts[i].alt,
        prompt: imagePrompts[i].prompt
      })

      console.log(`Image ${i + 1} generated successfully`)

      // Add small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error(`Error generating image ${i + 1}:`, error)
      // Continue with other images even if one fails
    }
  }

  return images
}

/**
 * Analyze image using xAI Vision API
 */
export async function analyzeImageWithVision(
  apiKey: string,
  imageUrl: string,
  analysisPrompt: string = "Describe this image in detail, including composition, colors, style, subjects, and any text or branding. Focus on visual elements that could be recreated in a new original image."
): Promise<string> {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              },
              {
                type: 'text',
                text: analysisPrompt
              }
            ]
          }
        ],
        model: 'grok-2-vision-beta',
        temperature: 0.5,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `xAI Vision API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()
    const analysis = data.choices[0]?.message?.content

    if (!analysis) {
      throw new Error('No analysis returned from xAI Vision')
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing image with Vision:', error)
    throw error
  }
}

/**
 * Generate enhanced image based on reference image analysis
 */
export async function generateEnhancedImage(
  apiKey: string,
  keyword: string,
  referenceImageUrl: string,
  removeContactInfo: boolean = true
): Promise<{ url: string; alt: string; prompt: string }> {
  try {
    console.log(`Analyzing reference image for: ${keyword}`)

    // Step 1: Analyze reference image with Vision
    const visionPrompt = `Analyze this image and describe:
1. Main subject and composition
2. Color palette and lighting
3. Visual style (photorealistic, illustration, abstract, etc.)
4. Key visual elements
5. Any text, watermarks, logos, or contact information present

Focus on elements that can inspire a NEW original image. ${removeContactInfo ? 'Note any text or branding that should NOT be included in the recreation.' : ''}`

    const analysis = await analyzeImageWithVision(apiKey, referenceImageUrl, visionPrompt)
    console.log('Vision analysis:', analysis.substring(0, 200) + '...')

    // Step 2: Create enhanced prompt for image generation
    const enhancedPrompt = `Create a professional, high-quality image inspired by this description: ${analysis}

Requirements:
- Image should be original and unique (NOT a copy)
- Professional, photorealistic style
- 1280x720 aspect ratio
- High resolution and sharp details
- Related to: ${keyword}
${removeContactInfo ? '- NO text, watermarks, logos, or contact information' : ''}
${removeContactInfo ? '- Clean, professional composition without any branding' : ''}
- Suitable for editorial/blog use`

    console.log('Generating enhanced image with vision-based prompt')

    // Step 3: Generate new image based on analysis
    const imageUrl = await generateImage({
      apiKey,
      prompt: enhancedPrompt,
    })

    return {
      url: imageUrl,
      alt: `Professional image for ${keyword} (AI-generated, reference-inspired)`,
      prompt: enhancedPrompt
    }
  } catch (error) {
    console.error('Error generating enhanced image:', error)
    throw error
  }
}

/**
 * Intelligent agent to decide image generation strategy
 * Returns true if keyword is niche and requires enhanced search+vision workflow
 */
export async function shouldUseEnhancedImageGeneration(
  apiKey: string,
  keywords: string,
  title: string
): Promise<{ useEnhanced: boolean; reasoning: string }> {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are an AI image generation strategy expert. Analyze keywords and determine if they are:
1. GENERIC/COMMON - Can be easily generated with AI (landscapes, emotions, abstract concepts, common objects)
2. NICHE/SPECIFIC - Require reference images for accuracy (specific products, technical items, rare subjects, branded items, specific locations, unique designs)

Return ONLY a JSON object with this exact format:
{
  "useEnhanced": boolean,
  "reasoning": "brief explanation"
}`
          },
          {
            role: 'user',
            content: `Analyze these keywords and title:
Keywords: "${keywords}"
Title: "${title}"

Should we use enhanced image generation (search real images + AI vision + regenerate) or standard AI generation?`
          }
        ],
        model: 'grok-beta',
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No analysis returned')
    }

    // Parse JSON response
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleanedContent)

    console.log(`Image strategy decision for "${keywords}":`, result.useEnhanced ? 'ENHANCED' : 'STANDARD')
    console.log(`Reasoning: ${result.reasoning}`)

    return result
  } catch (error) {
    console.error('Error in strategy decision, defaulting to standard generation:', error)
    // Default to standard generation if decision fails
    return {
      useEnhanced: false,
      reasoning: 'Analysis failed, using standard generation as fallback'
    }
  }
}

/**
 * Generate multiple enhanced images using Bright Data + xAI Vision + xAI Image Generation
 * This creates more niche-specific images by analyzing real reference images
 */
export async function generateMultipleEnhancedImages(
  apiKey: string,
  title: string,
  keywords: string,
  count: number = 5
): Promise<ImageWithAlt[]> {
  const images: ImageWithAlt[] = []

  try {
    // Import Bright Data search
    const { searchImages } = await import('@/lib/brightdata')

    console.log(`Searching for reference images: ${keywords}`)

    // Search for reference images using Bright Data
    const referenceImages = await searchImages({
      keyword: keywords,
      language: 'en',
      country: 'US',
      startPage: 1,
      endPage: 2,
    })

    if (referenceImages.length === 0) {
      console.log('No reference images found, falling back to standard generation')
      return await generateMultipleImages(apiKey, title, '', count)
    }

    console.log(`Found ${referenceImages.length} reference images`)

    // Generate images based on top reference images
    const imagesToProcess = Math.min(count, referenceImages.length)

    for (let i = 0; i < imagesToProcess; i++) {
      try {
        console.log(`Generating enhanced image ${i + 1}/${count} based on reference`)

        const enhanced = await generateEnhancedImage(
          apiKey,
          keywords,
          referenceImages[i].url,
          true // Remove contact info
        )

        images.push(enhanced)
        console.log(`Enhanced image ${i + 1} generated successfully`)

        // Add delay to avoid rate limiting
        if (i < imagesToProcess - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.error(`Error generating enhanced image ${i + 1}:`, error)
        // Continue with other images
      }
    }

    // If we didn't get enough images, fill with standard generation
    if (images.length < count) {
      console.log(`Filling remaining ${count - images.length} images with standard generation`)

      const remaining = count - images.length
      const standardPrompts = [
        `Professional image for ${title}, photorealistic, 1280x720`,
        `High-quality editorial image about ${keywords}, clean composition`,
        `Detailed illustration for ${title}, professional style`,
      ]

      for (let i = 0; i < remaining && i < standardPrompts.length; i++) {
        try {
          const url = await generateImage({
            apiKey,
            prompt: standardPrompts[i],
          })

          images.push({
            url,
            alt: `Professional image for ${title}`,
            prompt: standardPrompts[i]
          })

          if (i < remaining - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error(`Error generating standard image:`, error)
        }
      }
    }

    return images
  } catch (error) {
    console.error('Error in enhanced image generation workflow:', error)
    // Fallback to standard generation if enhanced workflow fails
    console.log('Falling back to standard image generation')
    return await generateMultipleImages(apiKey, title, '', count)
  }
}

export async function testXAIConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.x.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error('Error testing xAI connection:', error)
    return false
  }
}
