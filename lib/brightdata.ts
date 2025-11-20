export interface BrightDataImageSearchParams {
  keyword: string
  language?: string
  country?: string
  startPage?: number
  endPage?: number
}

export interface BrightDataImage {
  url: string
  title?: string
  source?: string
  width?: number
  height?: number
}

/**
 * Search Google Images using Bright Data SERP API
 */
export async function searchImages(
  params: BrightDataImageSearchParams
): Promise<BrightDataImage[]> {
  const apiKey = process.env.BRIGHT_DATA_API_KEY
  if (!apiKey) {
    throw new Error('BRIGHT_DATA_API_KEY is not configured')
  }

  const {
    keyword,
    language = 'en',
    country = 'US',
    startPage = 1,
    endPage = 3, // Search first 3 pages to get more options
  } = params

  try {
    console.log(`Searching Bright Data for images: "${keyword}"`)

    // Trigger the search
    const triggerResponse = await fetch(
      'https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_mfz5x93lmsjjjylob&include_errors=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            url: 'https://www.google.com/imghp',
            keyword: keyword,
            language: language,
            country: country,
            start_page: startPage,
            end_page: endPage,
          },
        ]),
      }
    )

    if (!triggerResponse.ok) {
      const errorData = await triggerResponse.json().catch(() => ({}))
      throw new Error(
        `Bright Data trigger error: ${triggerResponse.status} ${triggerResponse.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    const triggerData = await triggerResponse.json()
    const snapshotId = triggerData.snapshot_id

    if (!snapshotId) {
      throw new Error('No snapshot_id returned from Bright Data')
    }

    console.log(`Bright Data search triggered, snapshot_id: ${snapshotId}`)

    // Poll for results (max 30 seconds)
    let attempts = 0
    const maxAttempts = 30
    let results: any[] = []

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

      const resultsResponse = await fetch(
        `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      )

      if (resultsResponse.ok) {
        const data = await resultsResponse.json()

        if (Array.isArray(data) && data.length > 0) {
          results = data
          console.log(`Bright Data returned ${results.length} results`)
          break
        }
      } else if (resultsResponse.status === 404) {
        // Still processing
        attempts++
        console.log(`Waiting for Bright Data results... attempt ${attempts}/${maxAttempts}`)
        continue
      } else {
        const errorData = await resultsResponse.json().catch(() => ({}))
        throw new Error(
          `Bright Data results error: ${resultsResponse.status} ${resultsResponse.statusText}. ${JSON.stringify(errorData)}`
        )
      }
    }

    if (results.length === 0) {
      throw new Error('Bright Data search timed out or returned no results')
    }

    // Extract image URLs from results
    const images: BrightDataImage[] = []

    for (const result of results) {
      if (result.image_url && typeof result.image_url === 'string') {
        images.push({
          url: result.image_url,
          title: result.title || result.alt_text || '',
          source: result.source_url || result.page_url || '',
          width: result.width,
          height: result.height,
        })
      }
    }

    console.log(`Extracted ${images.length} image URLs from Bright Data`)
    return images.slice(0, 10) // Return top 10 images
  } catch (error) {
    console.error('Error searching Bright Data:', error)
    throw error
  }
}
