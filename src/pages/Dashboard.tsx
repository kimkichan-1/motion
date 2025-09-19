import { useState } from 'react'

interface Project {
  id: string
  name: string
  model: string
  motion: string
  status: 'draft' | 'processing' | 'completed'
  lastModified: string
  thumbnail: string
}

interface RecentActivity {
  id: string
  type: 'upload' | 'motion_applied' | 'project_created' | 'download'
  description: string
  time: string
  icon: string
}

const Dashboard = () => {
  const [projects] = useState<Project[]>([
    {
      id: '1',
      name: '캐릭터 걷기 애니메이션',
      model: '캐릭터_001.glb',
      motion: '걷기 모션',
      status: 'completed',
      lastModified: '2024-01-15',
      thumbnail: '🧍‍♂️'
    },
    {
      id: '2',
      name: '로봇 댄스 프로젝트',
      model: '로봇_모델.fbx',
      motion: '댄스 루틴',
      status: 'processing',
      lastModified: '2024-01-14',
      thumbnail: '🤖'
    },
    {
      id: '3',
      name: '동물 점프 동작',
      model: '동물_캐릭터.obj',
      motion: '점프 모션',
      status: 'draft',
      lastModified: '2024-01-13',
      thumbnail: '🐱'
    }
  ])

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'motion_applied',
      description: '캐릭터_001에 걷기 모션이 적용되었습니다',
      time: '2시간 전',
      icon: '🎭'
    },
    {
      id: '2',
      type: 'upload',
      description: '새로운 3D 모델이 업로드되었습니다',
      time: '5시간 전',
      icon: '📁'
    },
    {
      id: '3',
      type: 'project_created',
      description: '새 프로젝트 "로봇 댄스"가 생성되었습니다',
      time: '1일 전',
      icon: '📋'
    },
    {
      id: '4',
      type: 'download',
      description: '완성된 모션이 다운로드되었습니다',
      time: '2일 전',
      icon: '📥'
    }
  ])

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    }

    const statusText = {
      draft: '초안',
      processing: '처리중',
      completed: '완료'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status as keyof typeof statusStyles]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    )
  }

  const stats = [
    { title: '총 프로젝트', value: '12', icon: '📋', color: 'text-blue-600' },
    { title: '업로드된 모델', value: '8', icon: '🎨', color: 'text-green-600' },
    { title: '적용된 모션', value: '15', icon: '🎭', color: 'text-purple-600' },
    { title: '완료된 작업', value: '9', icon: '✅', color: 'text-orange-600' }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
        <p className="text-gray-600">
          프로젝트 현황과 최근 활동을 한눈에 확인하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`text-3xl ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 최근 프로젝트 */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">최근 프로젝트</h2>
            <button className="btn-primary text-sm">
              새 프로젝트
            </button>
          </div>

          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{project.thumbnail}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600">
                        {project.model} + {project.motion}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>마지막 수정: {project.lastModified}</span>
                  <div className="flex space-x-2">
                    <button className="text-primary-600 hover:text-primary-700">
                      편집
                    </button>
                    <button className="text-gray-600 hover:text-gray-700">
                      공유
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              모든 프로젝트 보기 →
            </button>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">최근 활동</h2>

          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">{activity.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              모든 활동 보기 →
            </button>
          </div>
        </div>
      </div>

      {/* 빠른 시작 */}
      <div className="mt-8 card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">빠른 시작</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">3D 모델 업로드</h3>
            <p className="text-gray-600 mb-4">
              GLB, FBX, OBJ 파일을 업로드하여 시작하세요
            </p>
            <button className="btn-primary w-full">
              모델 업로드
            </button>
          </div>

          <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="text-4xl mb-4">📹</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">모션 캡처</h3>
            <p className="text-gray-600 mb-4">
              카메라로 동작을 촬영하여 3D 모션으로 변환하세요
            </p>
            <button className="btn-primary w-full">
              캡처 시작
            </button>
          </div>

          <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">모션 라이브러리</h3>
            <p className="text-gray-600 mb-4">
              미리 제작된 모션을 찾아 모델에 적용하세요
            </p>
            <button className="btn-primary w-full">
              라이브러리 탐색
            </button>
          </div>
        </div>
      </div>

      {/* 사용량 현황 */}
      <div className="mt-8 card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">이번 달 사용량</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">스토리지 사용량</span>
              <span className="text-sm text-gray-600">2.3GB / 10GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full" style={{ width: '23%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">모션 변환 횟수</span>
              <span className="text-sm text-gray-600">47 / 100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '47%' }}></div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button className="btn-secondary text-sm">
            플랜 업그레이드
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard