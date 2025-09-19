import { useState } from 'react'

interface Motion {
  id: string
  name: string
  category: string
  tags: string[]
  duration: string
  thumbnail: string
  rating: number
  downloads: number
  preview: string
}

const MotionLibrary = () => {
  const [motions] = useState<Motion[]>([
    {
      id: '1',
      name: '걷기 애니메이션',
      category: '기본 동작',
      tags: ['걷기', '이동', '기본'],
      duration: '2.5초',
      thumbnail: '🚶‍♂️',
      rating: 4.8,
      downloads: 1250,
      preview: '기본적인 걷기 동작'
    },
    {
      id: '2',
      name: '점프 모션',
      category: '액션',
      tags: ['점프', '액션', '스포츠'],
      duration: '1.2초',
      thumbnail: '🤸‍♂️',
      rating: 4.6,
      downloads: 890,
      preview: '역동적인 점프 동작'
    },
    {
      id: '3',
      name: '댄스 루틴',
      category: '댄스',
      tags: ['댄스', '리듬', '엔터테인먼트'],
      duration: '15.0초',
      thumbnail: '💃',
      rating: 4.9,
      downloads: 2100,
      preview: '현대적인 댄스 동작'
    },
    {
      id: '4',
      name: '인사 제스처',
      category: '제스처',
      tags: ['인사', '제스처', '소셜'],
      duration: '3.0초',
      thumbnail: '👋',
      rating: 4.4,
      downloads: 675,
      preview: '친근한 인사 동작'
    },
    {
      id: '5',
      name: '격투 콤보',
      category: '액션',
      tags: ['격투', '액션', '게임'],
      duration: '4.5초',
      thumbnail: '🥊',
      rating: 4.7,
      downloads: 1580,
      preview: '연속적인 격투 동작'
    },
    {
      id: '6',
      name: '앉기 동작',
      category: '기본 동작',
      tags: ['앉기', '휴식', '기본'],
      duration: '2.0초',
      thumbnail: '🪑',
      rating: 4.3,
      downloads: 920,
      preview: '자연스러운 앉기 동작'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [sortBy, setSortBy] = useState('인기순')
  const [selectedMotion, setSelectedMotion] = useState<Motion | null>(null)

  const categories = ['전체', '기본 동작', '액션', '댄스', '제스처', '스포츠']
  const sortOptions = ['인기순', '최신순', '평점순', '다운로드순']

  const filteredMotions = motions.filter(motion => {
    const matchesSearch = motion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motion.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === '전체' || motion.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const sortedMotions = [...filteredMotions].sort((a, b) => {
    switch (sortBy) {
      case '평점순':
        return b.rating - a.rating
      case '다운로드순':
        return b.downloads - a.downloads
      case '최신순':
        return b.id.localeCompare(a.id)
      default:
        return b.downloads - a.downloads // 인기순 = 다운로드순
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">모션 라이브러리</h1>
        <p className="text-gray-600">
          다양한 3D 모션을 검색하고 모델에 적용해보세요
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색
            </label>
            <input
              type="text"
              placeholder="모션 이름 또는 태그로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정렬
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {sortOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* 결과 수 */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              총 {sortedMotions.length}개의 모션
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 모션 그리드 */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedMotions.map((motion) => (
              <div
                key={motion.id}
                className={`card cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  selectedMotion?.id === motion.id ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => setSelectedMotion(motion)}
              >
                {/* 썸네일 */}
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-4xl">{motion.thumbnail}</div>
                </div>

                {/* 모션 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {motion.name}
                  </h3>

                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded">
                      {motion.category}
                    </span>
                    <span className="text-sm text-gray-600">{motion.duration}</span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm text-gray-600 ml-1">
                        {motion.rating} ({motion.downloads} 다운로드)
                      </span>
                    </div>
                  </div>

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {motion.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex space-x-2">
                    <button className="flex-1 btn-primary text-sm">
                      미리보기
                    </button>
                    <button className="flex-1 btn-secondary text-sm">
                      적용하기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          <div className="mt-8 flex justify-center">
            <nav className="flex space-x-2">
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                이전
              </button>
              <button className="px-3 py-2 text-sm bg-primary-500 text-white rounded-md">
                1
              </button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                다음
              </button>
            </nav>
          </div>
        </div>

        {/* 미리보기 패널 */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                모션 미리보기
              </h2>

              {selectedMotion ? (
                <div>
                  {/* 3D 뷰어 */}
                  <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-4">
                    <div className="text-center">
                      <div className="text-6xl mb-2">{selectedMotion.thumbnail}</div>
                      <p className="text-gray-600 text-sm">
                        3D 모션 미리보기
                      </p>
                      <p className="text-xs text-gray-500">
                        Three.js 뷰어가 여기에 구현됩니다
                      </p>
                    </div>
                  </div>

                  {/* 모션 상세 정보 */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedMotion.name}</h3>
                      <p className="text-gray-600 text-sm">{selectedMotion.preview}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">카테고리:</span>
                        <p className="font-medium">{selectedMotion.category}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">길이:</span>
                        <p className="font-medium">{selectedMotion.duration}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">평점:</span>
                        <p className="font-medium">⭐ {selectedMotion.rating}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">다운로드:</span>
                        <p className="font-medium">{selectedMotion.downloads}회</p>
                      </div>
                    </div>

                    {/* 태그 */}
                    <div>
                      <span className="text-gray-500 text-sm">태그:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedMotion.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 컨트롤 */}
                    <div className="border-t pt-4">
                      <div className="flex space-x-2 mb-4">
                        <button className="btn-secondary text-sm flex-1">
                          ▶️ 재생
                        </button>
                        <button className="btn-secondary text-sm flex-1">
                          ⏸️ 정지
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-500">재생 속도</label>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            defaultValue="1"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="space-y-2">
                      <button className="w-full btn-primary">
                        내 모델에 적용하기
                      </button>
                      <button className="w-full btn-secondary">
                        즐겨찾기에 추가
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎭</div>
                  <p className="text-gray-600">
                    모션을 선택하면 미리보기가 표시됩니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MotionLibrary