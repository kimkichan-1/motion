import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              3D 모션의
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}새로운 차원
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              카메라로 모션을 캡처하고, AI가 분석하여 3D 모델에 적용하세요.
              게임 개발이 이제 더 쉽고 창의적이 됩니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/capture" className="btn-primary text-lg px-8 py-3">
                지금 시작하기 🚀
              </Link>
              <Link to="/motions" className="btn-secondary text-lg px-8 py-3">
                모션 라이브러리 둘러보기
              </Link>
            </div>
          </div>
        </div>

        {/* 배경 장식 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              혁신적인 기능들
            </h2>
            <p className="text-lg text-gray-600">
              전문가 수준의 3D 모션을 누구나 쉽게 만들 수 있습니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 3D 모델 관리 */}
            <div className="card text-center hover:shadow-lg transition-shadow duration-300">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-3">3D 모델 관리</h3>
              <p className="text-gray-600 mb-4">
                GLB, FBX, OBJ 등 다양한 형식의 3D 모델을 업로드하고 관리하세요
              </p>
              <Link to="/models" className="text-primary-600 hover:text-primary-700 font-medium">
                자세히 보기 →
              </Link>
            </div>

            {/* 모션 캡처 */}
            <div className="card text-center hover:shadow-lg transition-shadow duration-300">
              <div className="text-4xl mb-4">📹</div>
              <h3 className="text-xl font-semibold mb-3">스마트 모션 캡처</h3>
              <p className="text-gray-600 mb-4">
                웹캠이나 스마트폰으로 동작을 촬영하면 AI가 3D 모션으로 변환합니다
              </p>
              <Link to="/capture" className="text-primary-600 hover:text-primary-700 font-medium">
                지금 체험하기 →
              </Link>
            </div>

            {/* 모션 라이브러리 */}
            <div className="card text-center hover:shadow-lg transition-shadow duration-300">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold mb-3">모션 라이브러리</h3>
              <p className="text-gray-600 mb-4">
                다양한 미리 제작된 모션을 검색하고 모델에 바로 적용해보세요
              </p>
              <Link to="/motions" className="text-primary-600 hover:text-primary-700 font-medium">
                라이브러리 탐색 →
              </Link>
            </div>

            {/* 실시간 편집 */}
            <div className="card text-center hover:shadow-lg transition-shadow duration-300">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">실시간 편집</h3>
              <p className="text-gray-600 mb-4">
                적용된 모션을 실시간으로 수정하고 결과를 바로 확인할 수 있습니다
              </p>
              <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
                편집 도구 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 워크플로우 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              간단한 3단계 워크플로우
            </h2>
            <p className="text-lg text-gray-600">
              복잡한 과정 없이 누구나 쉽게 3D 모션을 만들 수 있습니다
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-primary-600 font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">업로드 & 캡처</h3>
              <p className="text-gray-600">
                3D 모델을 업로드하고 원하는 동작을 카메라로 촬영하세요
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-primary-600 font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI 분석 & 적용</h3>
              <p className="text-gray-600">
                AI가 동작을 분석하여 3D 모델에 자동으로 적용합니다
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-primary-600 font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">편집 & 내보내기</h3>
              <p className="text-gray-600">
                결과를 편집하고 원하는 형식으로 내보내어 프로젝트에 사용하세요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 바로 시작해보세요
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            무료로 계정을 만들고 첫 번째 3D 모션을 만들어보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              무료 회원가입
            </Link>
            <Link
              to="/motions"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              데모 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage