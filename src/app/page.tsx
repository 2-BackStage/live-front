import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-8 animate-pulse">
          🎭 Live Performance
        </h1>
        <p className="text-xl mb-12 text-gray-300 max-w-2xl mx-auto">
          실시간으로 공연을 방송하고 시청하세요. 음악, 댄스, 마술, 예술 등 다양한 카테고리의 라이브 방송을 즐겨보세요.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link
            href="/broadcast"
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🎙️ 방송 시작하기
          </Link>
          
          <Link
            href="/live"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            📺 라이브 방송 보기
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold mb-2">음악</h3>
            <p className="text-gray-300">다양한 장르의 음악 공연을 실시간으로 감상하세요</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-4xl mb-4">💃</div>
            <h3 className="text-xl font-semibold mb-2">댄스</h3>
            <p className="text-gray-300">화려한 댄스 공연과 함께 즐거운 시간을 보내세요</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">예술</h3>
            <p className="text-gray-300">창의적인 예술 작품과 퍼포먼스를 감상하세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}
