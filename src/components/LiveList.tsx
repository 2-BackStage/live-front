'use client';

import { useEffect, useState } from "react";
import { Live } from "../types/liveServiceApi";
import { getLiveList, getLiveDetail } from "../api/liveServiceApi";
import { useRouter } from "next/navigation";

// 하드코딩된 카테고리 목록
const CATEGORIES = [
  { id: 1, name: "All", icon: "🎭" },
  { id: 2, name: "Music", icon: "🎵" },
  { id: 3, name: "Dance", icon: "💃" },
  { id: 4, name: "Magic", icon: "✨" },
  { id: 5, name: "Gag", icon: "😄" },
  { id: 6, name: "Art", icon: "🎨" },
  { id: 7, name: "Performance Art", icon: "🎪" },
  { id: 8, name: "ETC", icon: "🎯" },
];

export default function LiveList() {
  const [lives, setLives] = useState<Live[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(1); // 1: All
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 환경변수 이름을 명확하게 분리
  const userAccessToken = process.env.NEXT_PUBLIC_USER_ACCESS_TOKEN;
  const userUuid = process.env.NEXT_PUBLIC_USER_UUID;

  useEffect(() => {
    async function fetchData() {
      if (!userAccessToken) {
        console.error('User access token not found');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const liveRes = await getLiveList(userAccessToken, selectedCategory);
        setLives(liveRes.lives);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userAccessToken, selectedCategory]);

  const handleLiveClick = async (live: Live) => {
    if (!userUuid || !userAccessToken) {
      console.error('User UUID or Access Token not found');
      return;
    }
    
    try {
      const liveDetail = await getLiveDetail(live.streamKey, userUuid, userAccessToken);
      router.push(`/view/${live.streamKey}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">🔥 라이브 방송</h1>
        <p className="text-gray-300 text-lg">실시간으로 진행되는 다양한 공연을 감상하세요</p>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-8">
        <div className="flex gap-3 flex-wrap justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full border-2 transition-all duration-300 font-semibold flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? "bg-white text-purple-900 border-white shadow-lg scale-105"
                  : "bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50"
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">라이브 방송 목록을 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 방송 목록 */}
          {lives.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">😴</div>
              <h3 className="text-2xl font-bold text-white mb-2">현재 진행 중인 방송이 없습니다</h3>
              <p className="text-gray-300">곧 새로운 방송이 시작될 예정입니다!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {lives.map((live) => (
                <div
                  key={live.streamKey}
                  onClick={() => handleLiveClick(live)}
                  className="group cursor-pointer bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  {/* 썸네일 영역 */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    <div className="relative z-10 text-center">
                      <div className="text-4xl mb-2">🎭</div>
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                        🔴 LIVE
                      </div>
                    </div>
                    {/* 시청자 수 배지 */}
                    <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-sm">
                      👥 {live.viewerCount}
                    </div>
                  </div>
                  
                  {/* 방송 정보 */}
                  <div className="p-4">
                    <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {live.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-300">
                      <span className="flex items-center gap-1">
                        <span>👤</span>
                        <span className="truncate">{live.buskerUuid}</span>
                      </span>
                      <span className="text-red-400 font-semibold">
                        🔴 {live.viewerCount}명
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
