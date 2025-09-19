import { useCallback, useState } from 'react'

interface FileUploaderProps {
  accept: string
  onFileUpload: (file: File, url: string) => void
  onError?: (error: string) => void
  maxSize?: number // bytes
  children?: React.ReactNode
}

const FileUploader: React.FC<FileUploaderProps> = ({
  accept,
  onFileUpload,
  onError,
  maxSize = 100 * 1024 * 1024, // 100MB
  children
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const validateFile = (file: File): string | null => {
    // 파일 크기 검증
    if (file.size > maxSize) {
      return `파일 크기가 너무 큽니다. 최대 ${Math.round(maxSize / 1024 / 1024)}MB까지 업로드 가능합니다.`
    }

    // 파일 형식 검증
    const acceptedFormats = accept.split(',').map(format => format.trim().toLowerCase())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const mimeType = file.type.toLowerCase()

    const isValidFormat = acceptedFormats.some(format =>
      format === fileExtension ||
      format === mimeType ||
      (format.includes('*') && mimeType.startsWith(format.replace('*', '')))
    )

    if (!isValidFormat) {
      return `지원하지 않는 파일 형식입니다. (${accept})`
    }

    return null
  }

  const processFile = useCallback(async (file: File) => {
    const error = validateFile(file)
    if (error) {
      onError?.(error)
      return
    }

    setIsUploading(true)

    try {
      // File을 URL로 변환 (브라우저에서 직접 읽기 위함)
      const url = URL.createObjectURL(file)

      // 파일 정보 로깅
      console.log('File uploaded:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      })

      // 업로드 성공 콜백
      onFileUpload(file, url)

    } catch (error) {
      console.error('File processing error:', error)
      onError?.('파일 처리 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }, [onFileUpload, onError, accept, maxSize])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0]) // 첫 번째 파일만 처리
    }
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  const handleClick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = (e) => handleFileSelect(e as any)
    input.click()
  }, [accept, handleFileSelect])

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
        transition-all duration-200
        ${isDragging
          ? 'border-primary-400 bg-primary-50'
          : 'border-gray-300 hover:border-gray-400'
        }
        ${isUploading ? 'opacity-50 cursor-wait' : ''}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      {/* 업로딩 상태 */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">파일 처리 중...</p>
          </div>
        </div>
      )}

      {/* 기본 콘텐츠 또는 커스텀 콘텐츠 */}
      {children || (
        <div>
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            파일을 업로드하세요
          </h3>
          <p className="text-gray-600 mb-4">
            파일을 드래그하거나 클릭하여 업로드하세요
          </p>
          <p className="text-sm text-gray-500">
            지원 형식: {accept} (최대 {Math.round(maxSize / 1024 / 1024)}MB)
          </p>
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

export default FileUploader