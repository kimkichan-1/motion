import { useState } from 'react'

interface Model {
  id: string
  name: string
  format: string
  size: string
  thumbnail: string
  uploadDate: string
  status: 'uploaded' | 'processing' | 'ready'
}

const ModelManagement = () => {
  const [models] = useState<Model[]>([
    {
      id: '1',
      name: '캐릭터_001.glb',
      format: 'GLB',
      size: '2.5MB',
      thumbnail: '🧍‍♂️',
      uploadDate: '2024-01-15',
      status: 'ready'
    },
    {
      id: '2',
      name: '로봇_모델.fbx',
      format: 'FBX',
      size: '4.1MB',
      thumbnail: '🤖',
      uploadDate: '2024-01-14',
      status: 'ready'
    },
    {
      id: '3',
      name: '동물_캐릭터.obj',
      format: 'OBJ',
      size: '1.8MB',
      thumbnail: '🐱',
      uploadDate: '2024-01-13',
      status: 'processing'
    }
  ])

  const [dragActive, setDragActive] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      console.log('파일 업로드:', files[0].name)
      // 실제 업로드 로직
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      uploaded: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800'
    }

    const statusText = {
      uploaded: '업로드됨',
      processing: '처리중',
      ready: '준비완료'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status as keyof typeof statusStyles]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">3D 모델 관리</h1>
        <p className="text-gray-600">
          GLB, FBX, OBJ 등 다양한 형식의 3D 모델을 업로드하고 관리하세요
        </p>
      </div>

      {/* 업로드 영역 */}
      <div className="mb-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            dragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            3D 모델을 업로드하세요
          </h3>
          <p className="text-gray-600 mb-4">
            파일을 드래그하거나 클릭하여 업로드하세요
          </p>
          <p className="text-sm text-gray-500 mb-4">
            지원 형식: GLB, FBX, OBJ (최대 100MB)
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
          >
            파일 선택
          </button>
        </div>
      </div>

      {/* 모델 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">내 3D 모델</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  모델
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  형식
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  크기
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업로드 날짜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                          {model.thumbnail}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {model.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                      {model.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {model.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {model.uploadDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(model.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-900">
                        미리보기
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        편집
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3D 뷰어 섹션 */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">3D 모델 미리보기</h2>
        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-gray-600">
              모델을 선택하면 여기에서 미리보기가 표시됩니다
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Three.js 3D 뷰어가 여기에 구현됩니다
            </p>
          </div>
        </div>

        {/* 뷰어 컨트롤 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-secondary text-sm">
            🔄 회전
          </button>
          <button className="btn-secondary text-sm">
            🔍 확대/축소
          </button>
          <button className="btn-secondary text-sm">
            💡 조명
          </button>
          <button className="btn-secondary text-sm">
            📸 스크린샷
          </button>
        </div>
      </div>

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">3D 모델 업로드</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  파일 선택
                </label>
                <input
                  type="file"
                  accept=".glb,.fbx,.obj"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  모델 이름
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="모델 이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명 (선택사항)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="모델에 대한 설명을 입력하세요"
                />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 btn-secondary"
              >
                취소
              </button>
              <button
                onClick={() => {
                  // 업로드 로직
                  setShowUploadModal(false)
                }}
                className="flex-1 btn-primary"
              >
                업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelManagement