"use client"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Papa from "papaparse"

interface CSVUploaderProps {
  onUpload: (keywords: string[]) => void
}

export function CSVUploader({ onUpload }: CSVUploaderProps) {
  const [fileName, setFileName] = useState<string>("")
  const [preview, setPreview] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    Papa.parse(file, {
      complete: (results) => {
        // Extract keywords from CSV (assuming first column contains keywords)
        const keywords = results.data
          .map((row: any) => {
            // Get the first non-empty value in the row
            const firstValue = Array.isArray(row)
              ? row.find((cell: any) => cell && String(cell).trim())
              : row[Object.keys(row)[0]]
            return String(firstValue || "").trim()
          })
          .filter((keyword: string) => keyword.length > 0)

        setPreview(keywords.slice(0, 5))
        onUpload(keywords)
      },
      error: (error) => {
        console.error("Error parsing CSV:", error)
        alert("Error parsing CSV file")
      },
    })
  }

  const handleClear = () => {
    setFileName("")
    setPreview([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {!fileName ? (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">CSV file with keywords</p>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">{fileName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {preview.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-gray-700">
                Preview (first 5 keywords):
              </p>
              <ul className="text-xs text-gray-600 list-disc list-inside">
                {preview.map((keyword, index) => (
                  <li key={index}>{keyword}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
