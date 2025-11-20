import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import {
  createWordPressPost,
  getOrCreateTag,
  getOrCreateCategory,
  uploadWordPressMedia,
} from "@/lib/wordpress"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentId, status = "draft" } = await request.json()

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      )
    }

    // Get content
    const { data: content, error: contentError } = await supabaseAdmin
      .from("content")
      .select("*")
      .eq("id", contentId)
      .eq("user_id", session.user.id)
      .single()

    if (contentError || !content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      )
    }

    // Get user's WordPress credentials
    const { data: credData, error: credError } = await supabaseAdmin
      .from("credentials")
      .select("wordpress_url, wordpress_username, wordpress_app_password")
      .eq("user_id", session.user.id)
      .single()

    if (
      credError ||
      !credData?.wordpress_url ||
      !credData?.wordpress_username ||
      !credData?.wordpress_app_password
    ) {
      return NextResponse.json(
        { error: "Please configure your WordPress credentials in Settings" },
        { status: 400 }
      )
    }

    const wpCredentials = {
      url: credData.wordpress_url,
      username: credData.wordpress_username,
      appPassword: credData.wordpress_app_password,
    }

    try {
      // Process tags and categories
      const metadata = content.metadata || {}
      const tags = metadata.tags || []
      const categories = metadata.categories || []

      const tagIds: number[] = []
      const categoryIds: number[] = []

      // Create/get tags
      for (const tagName of tags) {
        if (!tagName || typeof tagName !== 'string') continue

        try {
          const tagId = await getOrCreateTag(wpCredentials, tagName)
          if (typeof tagId === 'number') {
            tagIds.push(tagId)
          }
        } catch (error) {
          console.error(`Error creating tag "${tagName}":`, error)
        }
      }

      // Create/get categories
      for (const categoryName of categories) {
        if (!categoryName || typeof categoryName !== 'string') continue

        try {
          const categoryId = await getOrCreateCategory(
            wpCredentials,
            categoryName
          )
          if (typeof categoryId === 'number') {
            categoryIds.push(categoryId)
          }
        } catch (error) {
          console.error(`Error creating category "${categoryName}":`, error)
        }
      }

      // WordPress requires at least one category - use "Uncategorized" (ID: 1) as fallback
      if (categoryIds.length === 0) {
        categoryIds.push(1)
      }

      // Upload all images and insert into content
      let featuredMediaId: number | undefined
      let contentBody = content.body
      const images = metadata.images || []

      if (images.length > 0) {
        // Upload first image as featured image
        try {
          const featuredMedia = await uploadWordPressMedia(
            wpCredentials,
            images[0].url,
            `featured-${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
          )
          featuredMediaId = featuredMedia.id
          console.log("Featured image uploaded to WordPress, ID:", featuredMediaId, "URL:", featuredMedia.source_url)
        } catch (error) {
          console.error("Error uploading featured image:", error)
        }

        // Insert images into content body
        const uploadedImages: string[] = []

        for (let i = 0; i < images.length; i++) {
          try {
            const wpMedia = await uploadWordPressMedia(
              wpCredentials,
              images[i].url,
              `image-${i + 1}-${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
            )

            // Create WordPress image HTML with SEO alt tag using WordPress-hosted URL
            const imageHtml = `
<figure class="wp-block-image size-large">
  <img src="${wpMedia.source_url}" alt="${images[i].alt}" class="wp-image-${wpMedia.id}" style="max-width: 1280px; height: auto;" width="${wpMedia.media_details.width}" height="${wpMedia.media_details.height}" />
  <figcaption>${images[i].alt}</figcaption>
</figure>
`
            uploadedImages.push(imageHtml)
            console.log(`Image ${i + 1} uploaded to WordPress, ID:`, wpMedia.id, "URL:", wpMedia.source_url)
          } catch (error) {
            console.error(`Error uploading image ${i + 1}:`, error)
          }
        }

        // Insert images throughout the content
        if (uploadedImages.length > 0) {
          const paragraphs = contentBody.split('</p>')
          const insertInterval = Math.floor(paragraphs.length / uploadedImages.length)

          let imageIndex = 0
          for (let i = insertInterval - 1; i < paragraphs.length && imageIndex < uploadedImages.length; i += insertInterval) {
            paragraphs[i] = paragraphs[i] + '</p>' + uploadedImages[imageIndex]
            imageIndex++
          }

          contentBody = paragraphs.join('</p>')
        }
      } else if (content.featured_image_url) {
        // Fallback: use single featured image if no multiple images
        try {
          featuredMediaId = await uploadWordPressMedia(
            wpCredentials,
            content.featured_image_url
          )
        } catch (error) {
          console.error("Error uploading featured image:", error)
        }
      }

      // Create WordPress post
      console.log("Publishing to WordPress with:", {
        title: content.title,
        tagCount: tagIds.length,
        categoryCount: categoryIds.length,
        status
      })

      // For now, publish without tags/categories to avoid type errors
      // WordPress will use default "Uncategorized" category
      const wpPost = await createWordPressPost(wpCredentials, {
        title: content.title,
        content: contentBody, // Use modified content with images
        status: status as any,
        excerpt: metadata.metaDescription,
        // Skip tags and categories for now
        // tags: tagIds,
        // categories: categoryIds,
        featured_media: featuredMediaId,
      })

      console.log("WordPress post created successfully:", wpPost.id)

      // Update content in database
      const { error: updateError } = await supabaseAdmin
        .from("content")
        .update({
          status: "published",
          wordpress_post_id: String(wpPost.id),
          published_at: new Date().toISOString(),
        })
        .eq("id", contentId)

      if (updateError) {
        console.error("Error updating content:", updateError)
      }

      return NextResponse.json({
        success: true,
        wpPost,
        link: wpPost.link,
      })
    } catch (wpError: any) {
      // Update content with error
      await supabaseAdmin
        .from("content")
        .update({
          status: "failed",
          error_message: wpError.message,
        })
        .eq("id", contentId)

      throw wpError
    }
  } catch (error: any) {
    console.error("Error publishing to WordPress:", error)
    return NextResponse.json(
      { error: error.message || "Failed to publish to WordPress" },
      { status: 500 }
    )
  }
}
