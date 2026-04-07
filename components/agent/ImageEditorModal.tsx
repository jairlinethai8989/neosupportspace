'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Dynamic import with no SSR because it relies heavily on window and canvas
const FilerobotImageEditor = dynamic(
  () => import('react-filerobot-image-editor'),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center bg-gray-900 text-white font-bold">กำลังโหลดเครื่องมือแก้ไขรูปภาพ...</div> }
)

type Props = {
  imageUrl: string
  fileName: string
  onClose: () => void
  onSave: (file: File) => void
}

export const ImageEditorModal: React.FC<Props> = ({ imageUrl, fileName, onClose, onSave }) => {
  const handleSave = (editedImageObject: any) => {
    // editedImageObject.imageBase64 is base64 string
    const base64str = editedImageObject.imageBase64
    if (!base64str) {
      alert('ไม่สามารถประมวลผลรูปภาพได้')
      return
    }

    // Convert base64 to Blob, then to File
    const arr = base64str.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    const blob = new Blob([u8arr], { type: mime })
    const file = new File([blob], `edited_${fileName}`, { type: mime })

    onSave(file)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 lg:p-10 backdrop-blur-sm">
       <button onClick={onClose} className="absolute top-6 right-6 text-white font-bold bg-black/50 hover:bg-red-600 rounded-full w-10 h-10 flex items-center justify-center transition-all z-[110]">
          ✕
       </button>
       <div className="w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl relative">
          <FilerobotImageEditor
            source={imageUrl}
            onSave={handleSave}
            onClose={onClose}
            annotationsCommon={{
              fill: '#ef4444', // Default red color for annotations (LINE style)
            }}
            Text={{ text: '...' }}
            tabsIds={['Annotate', 'Adjust', 'Filters', 'Watermark']} 
            defaultTabId={'Annotate'} 
            defaultToolId={'Pen'}
            savingPixelRatio={4}
            previewPixelRatio={window.devicePixelRatio}
            theme={{
              typography: {
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
       </div>
    </div>
  )
}
