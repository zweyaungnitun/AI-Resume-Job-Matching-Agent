import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '../lib/utils'

function UploadResume() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || droppedFile.type === 'application/msword')) {
      setFile(droppedFile)
      setError(null)
    } else {
      setError('Please drop a PDF or Word document')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const API_BASE_URL = `${window.location.origin.replace(':3000', ':8000')}/api`
      const response = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Upload failed')
      }

      window.location.href = '/matches'
    } catch (err: any) {
      setError(err.message || 'Error uploading resume. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resume Hub</h1>
        <p className="mt-2 text-muted-foreground">
          Upload your resume to unlock smart role recommendations and deeper career insights.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative rounded-2xl border-2 border-dashed transition-all',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background hover:border-primary/50',
            file && 'border-solid border-primary bg-primary/5'
          )}
        >
          <input
            type="file"
            id="file-input"
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc"
            disabled={isLoading}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <label
            htmlFor="file-input"
            className="flex flex-col items-center justify-center gap-3 px-6 py-12 cursor-pointer"
          >
            {file ? (
              <>
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">
                    Drag and drop your resume here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse your files
                  </p>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!file || isLoading}
          size="lg"
          className="w-full"
        >
          {isLoading ? 'Uploading...' : 'Upload & Find Matches'}
        </Button>
      </form>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-secondary/60 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Supported Formats
          </CardTitle>
          <CardDescription>
            We accept the following file types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-primary" />
              PDF (.pdf)
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-primary" />
              Word Documents (.docx, .doc)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default UploadResume
