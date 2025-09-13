import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
  isProcessing: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFileUpload,
  uploadedFile,
  isProcessing
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setUploadError(null);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');

    if (!pdfFile) {
      setUploadError('Please upload a PDF file');
      return;
    }

    if (pdfFile.size > 20 * 1024 * 1024) { // 20MB limit
      setUploadError('File size must be under 20MB');
      return;
    }

    onFileUpload(pdfFile);
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError(null);
      
      if (file.type !== 'application/pdf') {
        setUploadError('Please upload a PDF file');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        setUploadError('File size must be under 20MB');
        return;
      }

      onFileUpload(file);
    }
  }, [onFileUpload]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const removeFile = () => {
    setUploadError(null);
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">SOC1 Report Upload</h2>
      </div>

      {!uploadedFile ? (
        <Card
          className={cn(
            "relative border-2 border-dashed transition-all duration-300 cursor-pointer",
            isDragOver 
              ? "border-primary bg-accent/50 shadow-glow" 
              : "border-border hover:border-primary/50 bg-gradient-card"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-subtle flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="mb-2 text-lg font-medium text-foreground">
              Drop your SOC1 report here
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              or click to browse and select a PDF file
            </p>

            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />
            
            <Button 
              onClick={() => document.getElementById('file-upload')?.click()}
              variant="outline"
              size="lg"
              disabled={isProcessing}
              className="mx-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose PDF File
            </Button>

            <p className="mt-4 text-xs text-muted-foreground">
              Maximum file size: 20MB • PDF format only
            </p>
          </div>
        </Card>
      ) : (
        <Card className="bg-gradient-card border border-success/20 shadow-card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{uploadedFile.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadedFile.size)} • Uploaded successfully
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {uploadError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{uploadError}</p>
          </div>
        </Card>
      )}
    </div>
  );
};