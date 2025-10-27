'use client';

import Image from 'next/image';

export default function MbtiProPage() {
  return (
    <div className="bg-emerald-950 min-h-screen h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-8">
        {/* 메인 이미지 표시 영역 */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-4">
            {/* 임시: 이미지 경로 설정 필요 */}
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-4">
                이미지 파일 준비 필요
              </p>
              <div className="inline-block border-4 border-red-500 rounded-lg p-8 bg-yellow-100">
                <p className="text-blue-600 text-4xl font-bold">아14</p>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                MBTI 검사 양식 이미지가 여기에 표시됩니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 