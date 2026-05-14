'use client'

import React from 'react'
import { X, FileIcon, ImageIcon, FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FileUploadPreviewProps = {
  file: File | null
  onRemove: () => void
  loading?: boolean
}

export const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ file, onRemove, loading }) => {
  // Create object URL for image preview
  const previewUrl = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null

  // Cleanup effect
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  if (!file) return null

  const isImage = file.type.startsWith('image/')
  const isPdf = file.type === 'application/pdf'

  return (
    <div className="relative group animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-white/90 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg flex items-center gap-3 w-fit max-w-xs">
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
             <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
          {isImage ? (
            <img src={previewUrl!} alt="upload preview" className="w-full h-full object-cover" />
          ) : isPdf ? (
            <FileTextIcon className="w-5 h-5 text-red-500" />
          ) : (
            <FileIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex flex-col min-w-0 pr-4">
          <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{file.name}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors absolute -top-2 -right-2 shadow-sm border border-border bg-white"
          onClick={onRemove}
          disabled={loading}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
