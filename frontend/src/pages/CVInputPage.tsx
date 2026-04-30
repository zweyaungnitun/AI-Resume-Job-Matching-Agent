import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume, reviewCV } from '../services/api';
import { useWorkflow } from '../context/WorkflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Upload, FileText, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const CVInputPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCVText, setCVReview, setIsLoadingReview, setErrorReview } = useWorkflow();
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const uploadResult = await uploadResume(file);
      const resumeText = uploadResult.text || uploadResult.raw_text || '';

      if (!resumeText) {
        setError('Failed to extract text from the file. Please try a different file or paste your CV text.');
        return;
      }

      setCVText(resumeText);
      setIsLoadingReview(true);
      setErrorReview(null);
      const reviewResult = await reviewCV(resumeText);
      setCVReview(reviewResult.cv_review || reviewResult);
      navigate('/cv-review');
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume');
      setErrorReview(err.message || 'Failed to upload resume');
      setIsLoadingReview(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = async () => {
    if (!pastedText.trim()) {
      setError('Please paste your CV text');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setCVText(pastedText);
      setIsLoadingReview(true);
      setErrorReview(null);

      const reviewResult = await reviewCV(pastedText);
      setCVReview(reviewResult.cv_review || reviewResult);
      navigate('/cv-review');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze CV');
      setErrorReview(err.message || 'Failed to analyze CV');
      setIsLoadingReview(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (inputMethod === 'upload') {
      await handleUpload();
    } else {
      await handlePaste();
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>Step 1 of 4</Badge>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Upload Your Resume</h1>
        <p className="mt-2 text-muted-foreground">
          Start by uploading your CV or pasting it directly. We'll analyze it and provide detailed feedback.
        </p>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Input Method Tabs */}
      <div className="flex gap-2 rounded-lg border border-border bg-secondary/30 p-1">
        <button
          onClick={() => setInputMethod('upload')}
          className={cn(
            'flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors',
            inputMethod === 'upload'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="inline h-4 w-4 mr-2" />
          Upload File
        </button>
        <button
          onClick={() => setInputMethod('paste')}
          className={cn(
            'flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors',
            inputMethod === 'paste'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FileText className="inline h-4 w-4 mr-2" />
          Paste Text
        </button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {inputMethod === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                'relative rounded-lg border-2 border-dashed transition-colors px-6 py-12',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:border-primary/50',
                file && 'border-solid border-primary bg-primary/5'
              )}
            >
              <input
                type="file"
                id="file-input"
                onChange={handleFileSelect}
                accept=".pdf,.docx,.doc,.txt"
                disabled={isProcessing}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <label htmlFor="file-input" className="flex flex-col items-center justify-center gap-3 cursor-pointer">
                {file ? (
                  <>
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-semibold text-foreground">
                        Drag and drop your resume here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse (PDF, DOCX, DOC, or TXT)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your resume or CV here. Include all sections: Contact Info, Summary, Experience, Education, Skills, etc."
                className="w-full h-64 px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                {pastedText.length} characters
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={
              isProcessing || (inputMethod === 'upload' ? !file : !pastedText.trim())
            }
            className="w-full mt-6"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Processing...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="bg-secondary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Tips for Best Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm">
              <span className="text-primary">✓</span>
              <span>Include all your professional experience and education</span>
            </li>
            <li className="flex gap-2 text-sm">
              <span className="text-primary">✓</span>
              <span>List all relevant skills and certifications</span>
            </li>
            <li className="flex gap-2 text-sm">
              <span className="text-primary">✓</span>
              <span>Use clear formatting and standard section headings</span>
            </li>
            <li className="flex gap-2 text-sm">
              <span className="text-primary">✓</span>
              <span>Include measurable achievements and metrics</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
