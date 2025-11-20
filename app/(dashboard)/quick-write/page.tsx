"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CSVUploader } from "@/components/dashboard/CSVUploader"
import { Loader2, Sparkles } from "lucide-react"

type GenerationMode = "best-quality" | "normal" | "most-saving"

export default function QuickWritePage() {
  const router = useRouter()
  const [mode, setMode] = useState<"single" | "batch">("single")
  const [generationMode, setGenerationMode] = useState<GenerationMode>("normal")
  const [keyword, setKeyword] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSingleGenerate = async () => {
    if (!keyword.trim()) {
      setError("Please enter a keyword")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Generating content for keyword:", keyword, "Mode:", generationMode)
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keyword, generationMode }),
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate content")
      }

      // Success! Show alert before redirect
      alert("Content generated successfully! Redirecting to Content Library...")
      router.push("/content-library")
      router.refresh()
    } catch (err: any) {
      console.error("Error generating content:", err)
      setError(err.message || "Failed to generate content")
      alert("Error: " + (err.message || "Failed to generate content"))
    } finally {
      setLoading(false)
    }
  }

  const handleBatchGenerate = async () => {
    if (keywords.length === 0) {
      setError("Please upload a CSV file with keywords")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/content/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start batch processing")
      }

      // Redirect to content library
      router.push("/content-library")
    } catch (err: any) {
      setError(err.message || "Failed to start batch processing")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quick Write</h1>
        <p className="text-gray-600 mt-2">
          Generate AI-powered content from keywords
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-4">
        <Button
          variant={mode === "single" ? "default" : "outline"}
          onClick={() => setMode("single")}
        >
          Single Keyword
        </Button>
        <Button
          variant={mode === "batch" ? "default" : "outline"}
          onClick={() => setMode("batch")}
        >
          Batch Upload (CSV)
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Generation Mode Selection */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg">Select Quality Mode</CardTitle>
          <CardDescription>
            Choose the balance between quality and cost that fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Best Quality Mode */}
            <button
              onClick={() => setGenerationMode("best-quality")}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                generationMode === "best-quality"
                  ? "border-purple-600 bg-purple-50 shadow-lg"
                  : "border-gray-200 bg-white hover:border-purple-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">Best Quality</h3>
                {generationMode === "best-quality" && (
                  <Sparkles className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">
                  $0.22-0.33
                  <span className="text-xs text-gray-500 font-normal">/post</span>
                </div>
                <div className="text-xs text-purple-700 font-medium bg-purple-100 px-2 py-1 rounded">
                  ~2,500-3,500 tokens
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ 5 AI-generated images</li>
                  <li>✓ Grok-4 (best model)</li>
                  <li>✓ Smart agent workflow</li>
                  <li>✓ Enhanced niche images</li>
                  <li>✓ 1000 words</li>
                </ul>
              </div>
            </button>

            {/* Normal Mode */}
            <button
              onClick={() => setGenerationMode("normal")}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                generationMode === "normal"
                  ? "border-blue-600 bg-blue-50 shadow-lg"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">Normal</h3>
                {generationMode === "normal" && (
                  <Sparkles className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  $0.06
                  <span className="text-xs text-gray-500 font-normal">/post</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ 1 featured image</li>
                  <li>✓ Grok-4 (best model)</li>
                  <li>✓ Standard workflow</li>
                  <li>✓ Fast generation</li>
                  <li>✓ 1000 words</li>
                </ul>
              </div>
            </button>

            {/* Most Saving Mode */}
            <button
              onClick={() => setGenerationMode("most-saving")}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                generationMode === "most-saving"
                  ? "border-green-600 bg-green-50 shadow-lg"
                  : "border-gray-200 bg-white hover:border-green-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">Most Saving</h3>
                {generationMode === "most-saving" && (
                  <Sparkles className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  $0.045
                  <span className="text-xs text-gray-500 font-normal">/post</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ 1 featured image</li>
                  <li>✓ Grok-3-mini (faster)</li>
                  <li>✓ Budget workflow</li>
                  <li>✓ Cost-optimized</li>
                  <li>✓ 800 words</li>
                </ul>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {mode === "single" ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate Single Article</CardTitle>
            <CardDescription>
              Enter a keyword or topic to generate content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword or Topic</Label>
              <Textarea
                id="keyword"
                placeholder="e.g., 'Benefits of AI in healthcare' or 'How to start a blog'"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                rows={3}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Enter a keyword, topic, or question to generate an article about
              </p>
            </div>

            <Button
              onClick={handleSingleGenerate}
              disabled={loading || !keyword.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Batch Generate from CSV</CardTitle>
            <CardDescription>
              Upload a CSV file with keywords to generate multiple articles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CSVUploader onUpload={setKeywords} />

            {keywords.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">
                  {keywords.length} keywords loaded
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Click the button below to start generating content for all keywords
                </p>
              </div>
            )}

            <Button
              onClick={handleBatchGenerate}
              disabled={loading || keywords.length === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Batch Process...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate All ({keywords.length} articles)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-sm text-gray-900 mb-2">How it works</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Enter keywords or upload a CSV file</li>
            <li>AI will generate SEO-optimized content for each keyword</li>
            <li>Review and edit the content in the Content Library</li>
            <li>Publish directly to WordPress when ready</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
