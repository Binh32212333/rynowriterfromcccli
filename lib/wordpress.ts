export interface WordPressCredentials {
  url: string
  username: string
  appPassword: string
}

export interface WordPressPost {
  title: string
  content: string
  status?: 'publish' | 'draft' | 'pending' | 'private'
  excerpt?: string
  tags?: number[]
  categories?: number[]
  featured_media?: number
}

export interface WordPressPostResponse {
  id: number
  link: string
  status: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
  }
}

/**
 * Create a WordPress post
 */
export async function createWordPressPost(
  credentials: WordPressCredentials,
  post: WordPressPost
): Promise<WordPressPostResponse> {
  const { url, username, appPassword } = credentials

  // Ensure URL doesn't have trailing slash
  const baseUrl = url.replace(/\/$/, '')

  try {
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
      },
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        status: post.status || 'draft',
        excerpt: post.excerpt || '',
        tags: post.tags || [],
        categories: post.categories || [],
        featured_media: post.featured_media || 0,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `WordPress API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating WordPress post:', error)
    throw error
  }
}

/**
 * Update a WordPress post
 */
export async function updateWordPressPost(
  credentials: WordPressCredentials,
  postId: number,
  post: Partial<WordPressPost>
): Promise<WordPressPostResponse> {
  const { url, username, appPassword } = credentials
  const baseUrl = url.replace(/\/$/, '')

  try {
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
      },
      body: JSON.stringify(post),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `WordPress API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating WordPress post:', error)
    throw error
  }
}

export interface WordPressMediaResponse {
  id: number
  source_url: string
  media_details: {
    width: number
    height: number
    file: string
  }
}

/**
 * Upload media to WordPress and return full media data
 */
export async function uploadWordPressMedia(
  credentials: WordPressCredentials,
  imageUrl: string,
  filename?: string
): Promise<WordPressMediaResponse> {
  const { url, username, appPassword } = credentials
  const baseUrl = url.replace(/\/$/, '')

  try {
    // Fetch the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image')
    }

    const imageBlob = await imageResponse.blob()
    const imageName = filename || `image-${Date.now()}.jpg`

    // Upload to WordPress
    const formData = new FormData()
    formData.append('file', imageBlob, imageName)

    const response = await fetch(`${baseUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `WordPress media upload error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()
    return {
      id: data.id,
      source_url: data.source_url,
      media_details: data.media_details
    }
  } catch (error) {
    console.error('Error uploading WordPress media:', error)
    throw error
  }
}

/**
 * Get or create WordPress tag by name
 */
export async function getOrCreateTag(
  credentials: WordPressCredentials,
  tagName: string
): Promise<number> {
  const { url, username, appPassword } = credentials
  const baseUrl = url.replace(/\/$/, '')

  try {
    // Search for existing tag
    const searchResponse = await fetch(
      `${baseUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(tagName)}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
        },
      }
    )

    const existingTags = await searchResponse.json()
    if (existingTags.length > 0) {
      return existingTags[0].id
    }

    // Create new tag
    const createResponse = await fetch(`${baseUrl}/wp-json/wp/v2/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
      },
      body: JSON.stringify({ name: tagName }),
    })

    const newTag = await createResponse.json()
    return newTag.id
  } catch (error) {
    console.error('Error getting/creating tag:', error)
    throw error
  }
}

/**
 * Get or create WordPress category by name
 */
export async function getOrCreateCategory(
  credentials: WordPressCredentials,
  categoryName: string
): Promise<number> {
  const { url, username, appPassword } = credentials
  const baseUrl = url.replace(/\/$/, '')

  try {
    // Search for existing category
    const searchResponse = await fetch(
      `${baseUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(categoryName)}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
        },
      }
    )

    const existingCategories = await searchResponse.json()
    if (existingCategories.length > 0) {
      return existingCategories[0].id
    }

    // Create new category
    const createResponse = await fetch(`${baseUrl}/wp-json/wp/v2/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
      },
      body: JSON.stringify({ name: categoryName }),
    })

    const newCategory = await createResponse.json()
    return newCategory.id
  } catch (error) {
    console.error('Error getting/creating category:', error)
    throw error
  }
}

/**
 * Test WordPress connection
 */
export async function testWordPressConnection(
  credentials: WordPressCredentials
): Promise<boolean> {
  const { url, username, appPassword } = credentials
  const baseUrl = url.replace(/\/$/, '')

  try {
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error('Error testing WordPress connection:', error)
    return false
  }
}
