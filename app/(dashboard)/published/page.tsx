"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/utils"
import { ExternalLink, Loader2, CheckCircle2 } from "lucide-react"

interface PublishedContent {
  id: string
  title: string
  body: string
  keywords: string
  wordpress_post_id: string
  published_at: string
  metadata: any
  featured_image_url?: string
}

export default function PublishedPage() {
  const [content, setContent] = useState<PublishedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [wpUrl, setWpUrl] = useState<string>("")

  useEffect(() => {
    fetchPublishedContent()
    fetchWpUrl()
  }, [])

  const fetchWpUrl = async () => {
    try {
      const response = await fetch("/api/credentials")
      const data = await response.json()

      if (data?.credentials?.wordpress_url) {
        setWpUrl(data.credentials.wordpress_url)
      }
    } catch (error) {
      console.error("Error fetching WordPress URL:", error)
    }
  }

  const fetchPublishedContent = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/content/list")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch content")
      }

      // Filter only published content
      const publishedContent = (data.content || []).filter(
        (item: PublishedContent) => item.status === "published"
      )

      setContent(publishedContent)
    } catch (error) {
      console.error("Error fetching published content:", error)
    } finally {
      setLoading(false)
    }
  }

  const getWordPressLink = (postId: string) => {
    if (!wpUrl) return null
    const baseUrl = wpUrl.replace(/\/$/, "")
    return `${baseUrl}/?p=${postId}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Published Content</h1>
          <p className="text-gray-600 mt-2">
            Content that has been published to WordPress
          </p>
        </div>
        <Button onClick={fetchPublishedContent} variant="outline">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : content.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <CheckCircle2 className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              No published content yet. Publish content from the Content Library.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {content.map((item) => {
            const wpLink = getWordPressLink(item.wordpress_post_id)
            const metadata = item.metadata || {}

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription className="mt-2">
                        Keywords: {item.keywords}
                      </CardDescription>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Published
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.featured_image_url && (
                    <div className="w-full h-48 relative rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={item.featured_image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div
                    className="prose prose-sm max-w-none line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: item.body.substring(0, 300) + "..." }}
                  />

                  {(metadata.tags?.length > 0 || metadata.categories?.length > 0) && (
                    <div className="flex gap-4 text-sm">
                      {metadata.tags?.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Tags:</span>{" "}
                          <span className="text-gray-600">{metadata.tags.join(", ")}</span>
                        </div>
                      )}
                      {metadata.categories?.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Categories:</span>{" "}
                          <span className="text-gray-600">{metadata.categories.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Published: {formatDateTime(item.published_at)}
                  </span>
                  {wpLink && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={wpLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on WordPress
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Stats */}
      {content.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-900">{content.length}</p>
                <p className="text-sm text-blue-700">Total Published</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-900">
                  {content.filter(c => {
                    const publishedDate = new Date(c.published_at)
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return publishedDate >= weekAgo
                  }).length}
                </p>
                <p className="text-sm text-blue-700">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
