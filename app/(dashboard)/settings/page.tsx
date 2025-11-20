"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, AlertCircle, Info } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<"xai" | "wordpress" | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [credentials, setCredentials] = useState({
    xai_api_key: "",
    wordpress_url: "",
    wordpress_username: "",
    wordpress_app_password: "",
  })

  useEffect(() => {
    fetchCredentials()
  }, [])

  const fetchCredentials = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/credentials")
      const { credentials: data } = await response.json()

      if (data && data.xai_api_key !== undefined) {
        setCredentials({
          xai_api_key: data.xai_api_key || "",
          wordpress_url: data.wordpress_url || "",
          wordpress_username: data.wordpress_username || "",
          wordpress_app_password: data.wordpress_app_password || "",
        })
      }
    } catch (error) {
      console.error("Error fetching credentials:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save credentials")
      }

      setMessage({ type: "success", text: "Credentials saved successfully!" })
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to save credentials" })
    } finally {
      setSaving(false)
    }
  }

  const testXAI = async () => {
    if (!credentials.xai_api_key) {
      setMessage({ type: "error", text: "Please enter your xAI API key first" })
      return
    }

    setTesting("xai")
    setMessage(null)

    try {
      const response = await fetch("https://api.x.ai/v1/models", {
        headers: {
          Authorization: `Bearer ${credentials.xai_api_key}`,
        },
      })

      if (response.ok) {
        setMessage({ type: "success", text: "xAI connection successful!" })
      } else {
        setMessage({ type: "error", text: "xAI connection failed. Check your API key." })
      }
    } catch (error) {
      setMessage({ type: "error", text: "xAI connection failed. Check your API key." })
    } finally {
      setTesting(null)
    }
  }

  const testWordPress = async () => {
    if (!credentials.wordpress_url || !credentials.wordpress_username || !credentials.wordpress_app_password) {
      setMessage({ type: "error", text: "Please fill in all WordPress credentials first" })
      return
    }

    setTesting("wordpress")
    setMessage(null)

    try {
      const baseUrl = credentials.wordpress_url.replace(/\/$/, "")
      const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          Authorization: `Basic ${btoa(`${credentials.wordpress_username}:${credentials.wordpress_app_password}`)}`,
        },
      })

      if (response.ok) {
        setMessage({ type: "success", text: "WordPress connection successful!" })
      } else {
        setMessage({ type: "error", text: "WordPress connection failed. Check your credentials." })
      }
    } catch (error) {
      setMessage({ type: "error", text: "WordPress connection failed. Check your URL and credentials." })
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your API keys and credentials
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-5 w-5 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 mt-0.5" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* xAI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>xAI API Configuration</CardTitle>
          <CardDescription>
            Get your API key from{" "}
            <a
              href="https://console.x.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              console.x.ai
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="xai_api_key">xAI API Key</Label>
            <Input
              id="xai_api_key"
              type="password"
              placeholder="xai-..."
              value={credentials.xai_api_key}
              onChange={(e) =>
                setCredentials({ ...credentials, xai_api_key: e.target.value })
              }
            />
          </div>
          <Button
            variant="outline"
            onClick={testXAI}
            disabled={testing === "xai"}
          >
            {testing === "xai" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* WordPress Settings */}
      <Card>
        <CardHeader>
          <CardTitle>WordPress Configuration</CardTitle>
          <CardDescription>
            Configure your WordPress site credentials for auto-publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wordpress_url">WordPress Site URL</Label>
            <Input
              id="wordpress_url"
              type="url"
              placeholder="https://yoursite.com"
              value={credentials.wordpress_url}
              onChange={(e) =>
                setCredentials({ ...credentials, wordpress_url: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wordpress_username">WordPress Username</Label>
            <Input
              id="wordpress_username"
              type="text"
              placeholder="admin"
              value={credentials.wordpress_username}
              onChange={(e) =>
                setCredentials({ ...credentials, wordpress_username: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wordpress_app_password">
              WordPress Application Password
            </Label>
            <Input
              id="wordpress_app_password"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={credentials.wordpress_app_password}
              onChange={(e) =>
                setCredentials({ ...credentials, wordpress_app_password: e.target.value })
              }
            />
            <div className="bg-blue-50 p-3 rounded-md flex gap-2 text-sm text-blue-800">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">How to create an Application Password:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-xs">
                  <li>Go to WordPress Dashboard → Users → Profile</li>
                  <li>Scroll to "Application Passwords" section</li>
                  <li>Enter a name and click "Add New Application Password"</li>
                  <li>Copy the generated password and paste it here</li>
                </ol>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={testWordPress}
            disabled={testing === "wordpress"}
          >
            {testing === "wordpress" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save All Settings"
          )}
        </Button>
      </div>
    </div>
  )
}
