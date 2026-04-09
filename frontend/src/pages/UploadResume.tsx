import { useState } from 'react'
import './UploadResume.css'

function UploadResume() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
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

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      // Redirect to matches page
      window.location.href = '/matches'
    } catch (err) {
      setError('Error uploading resume. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="upload-resume">
      <h2>Upload Your Resume</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="upload-area">
          <input
            type="file"
            id="file-input"
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc"
            disabled={isLoading}
          />
          <label htmlFor="file-input" className="file-label">
            {file ? file.name : 'Choose a PDF or DOCX file'}
          </label>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button
          type="submit"
          disabled={!file || isLoading}
          className="submit-button"
        >
          {isLoading ? 'Uploading...' : 'Upload & Find Matches'}
        </button>
      </form>

      <div className="info-box">
        <h3>Supported Formats</h3>
        <ul>
          <li>PDF (.pdf)</li>
          <li>Word Documents (.docx, .doc)</li>
        </ul>
      </div>
    </div>
  )
}

export default UploadResume
