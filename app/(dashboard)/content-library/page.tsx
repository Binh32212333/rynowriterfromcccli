"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/utils"
import { FileText, Upload, Trash2, Edit, Loader2, AlertCircle } from "lucide-react"

interface TokenStats {
  content: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  imageCount: number
  workflow: string
  model: string
}

interface Content {
  id: string
  title: string
  body: string
  keywords: string
  status: string
  created_at: string
  error_message?: string
  featured_image_url?: string
  metadata?: {
    tokenStats?: TokenStats
    tags?: string[]
    [key: string]: any
  }
}

export default function ContentLibraryPage() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchContent()
  }, [filter])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/content/list")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch content")
      }

      let filteredContent = data.content || []

      // Apply filter if not "all"
      if (filter !== "all") {
        filteredContent = filteredContent.filter((item: Content) => item.status === filter)
      }

      setContent(filteredContent)
      console.log("Fetched content:", filteredContent.length, "items")
    } catch (error) {
      console.error("Error fetching content:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (contentId: string) => {
    setPublishingId(contentId)
    try {
      const response = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, status: "publish" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish")
      }

      alert(`Successfully published! View at: ${data.link}`)
      fetchContent()
    } catch (error: any) {
      alert(error.message || "Failed to publish to WordPress")
    } finally {
      setPublishingId(null)
    }
  }

  const handleDelete = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return

    try {
      const response = await fetch("/api/content/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete")
      }

      fetchContent()
    } catch (error: any) {
      alert("Failed to delete content: " + (error.message || "Unknown error"))
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      generated: "bg-blue-100 text-blue-800",
      published: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600 mt-2">
            Manage your generated content
          </p>
        </div>
        <Button onClick={fetchContent} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "draft", "generated", "published", "failed"].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : content.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              No content found. Start by generating content in Quick Write.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {content.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="mt-2">
                      Keywords: {item.keywords}
                    </CardDescription>
                  </div>
                  {getStatusBadge(item.status)}
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

                {/* Token Usage Stats */}
                {item.metadata?.tokenStats && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Tokens:</span>
                        <span className="ml-1 text-purple-900 font-bold">
                          {item.metadata.tokenStats.content.total_tokens.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Images:</span>
                        <span className="ml-1 text-blue-900 font-bold">
                          {item.metadata.tokenStats.imageCount}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Model:</span>
                        <span className="ml-1 text-gray-600">
                          {item.metadata.tokenStats.model}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Mode:</span>
                        <span className={`ml-1 font-medium ${
                          item.metadata.tokenStats.workflow === 'budget' ? 'text-green-600' :
                          item.metadata.tokenStats.workflow === 'premium' ? 'text-purple-600' :
                          item.metadata.tokenStats.workflow === 'smart' ? 'text-purple-600' :
                          'text-blue-600'
                        }`}>
                          {item.metadata.tokenStats.workflow}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {item.metadata?.tags && item.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.metadata.tags.slice(0, 5).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {item.error_message && (
                  <div className="mt-4 bg-red-50 p-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{item.error_message}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Created: {formatDateTime(item.created_at)}
                </span>
                <div className="flex gap-2">
                  {item.status !== "published" && (
                    <Button
                      size="sm"
                      onClick={() => handlePublish(item.id)}
                      disabled={publishingId === item.id}
                    >
                      {publishingId === item.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Publish to WordPress
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
