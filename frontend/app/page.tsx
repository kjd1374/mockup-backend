import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <nav className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">시안 생성</h1>
            <div className="flex gap-4">
              <Link
                href="/base-products"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                기본형 관리
              </Link>
              <Link
                href="/references"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                레퍼런스 관리
              </Link>
              <Link
                href="/designs"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                시안 목록
              </Link>
              <Link
                href="/designs/create"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                시안 생성
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-semibold tracking-tight text-gray-900 mb-4">
            아크릴 응원봉 시안 생성
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            AI를 활용하여 고객 요청에 맞는 아크릴 응원봉 시안을 자동으로 생성합니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link
              href="/base-products"
              className="group p-8 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">기본형 등록</h3>
              <p className="text-sm text-gray-600">
                제품의 기본형 이미지와 설명을 등록하세요.
              </p>
            </Link>

            <Link
              href="/references"
              className="group p-8 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">레퍼런스 등록</h3>
              <p className="text-sm text-gray-600">
                실제 제작된 제품 이미지를 레퍼런스로 등록하세요.
              </p>
            </Link>

            <Link
              href="/designs"
              className="group p-8 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">시안 목록</h3>
              <p className="text-sm text-gray-600">
                생성된 시안을 확인하고 관리하세요.
              </p>
            </Link>
            <Link
              href="/designs/create"
              className="group p-8 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">시안 생성</h3>
              <p className="text-sm text-gray-600">
                로고와 이미지를 업로드하여 시안을 생성하세요.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
