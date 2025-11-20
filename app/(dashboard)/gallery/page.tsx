"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/utils"
import { Loader2, ImageIcon, Download, ExternalLink } from "lucide-react"

interface ImageWithAlt {
  url: string
  alt: string
  prompt: string
}

interface ImageContent {
  id: string
  title: string
  featured_image_url: string
  keywords: string
  created_at: string
  status: string
  wordpress_post_id?: string
  metadata?: {
    images?: ImageWithAlt[]
    [key: string]: any
  }
}

export default function GalleryPage() {
  const [images, setImages] = useState<ImageContent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/content/list")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch content")
      }

      // Filter only content with images (either featured_image_url or metadata.images)
      const contentWithImages = (data.content || []).filter(
        (item: ImageContent) => item.featured_image_url || item.metadata?.images?.length > 0
      )

      setImages(contentWithImages)
      console.log("Fetched content with images:", contentWithImages.length, "items")
    } catch (error) {
      console.error("Error fetching images:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading image:", error)
      alert("Failed to download image")
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      generated: "bg-blue-100 text-blue-800",
      published: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    }
    return colors[status] || colors.draft
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Image Gallery</h1>
          <p className="text-gray-600 mt-2">
            All AI-generated featured images from your content
          </p>
        </div>
        <Button onClick={fetchImages} variant="outline">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              No images yet. Generate content with images in Quick Write.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-blue-900">
                    {images.reduce((total, item) => {
                      const imageCount = item.metadata?.images?.length || (item.featured_image_url ? 1 : 0)
                      return total + imageCount
                    }, 0)}
                  </p>
                  <p className="text-sm text-blue-700">Total Images</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-900">{images.length}</p>
                  <p className="text-sm text-blue-700">Articles with Images</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-900">
                    {images.filter(img => img.status === "published").length}
                  </p>
                  <p className="text-sm text-blue-700">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((item) => {
              const itemImages = item.metadata?.images || []
              const allImages = itemImages.length > 0
                ? itemImages
                : item.featured_image_url
                  ? [{ url: item.featured_image_url, alt: item.title, prompt: "" }]
                  : []

              return allImages.map((image, idx) => (
                <Card key={`${item.id}-${idx}`} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-64 bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    {itemImages.length > 1 && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {idx + 1} of {itemImages.length}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="text-xs">
                      <strong>Alt:</strong> {image.alt}
                    </CardDescription>
                    <CardDescription className="text-xs mt-1">
                      {item.keywords}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex flex-col gap-2 pt-0">
                    <p className="text-xs text-gray-500 w-full">
                      {formatDateTime(item.created_at)}
                    </p>
                    <div className="flex gap-2 w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => downloadImage(image.url, `${item.title}-${idx + 1}`)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(image.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            })}
          </div>
        </>
      )}
    </div>
  )
}
