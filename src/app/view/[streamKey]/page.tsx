"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getLiveDetail, getCategoryList } from "../../../api/liveServiceApi";
import type { Live, Category } from "../../../types/liveServiceApi";

export default function ViewStreamPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { streamKey } = useParams<{ streamKey: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHost = searchParams.get("host") === "true";

  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [live, setLive] = useState<Live | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // 환경변수 이름을 명확하게 분리
  const userAccessToken = process.env.NEXT_PUBLIC_USER_ACCESS_TOKEN;
  const userUuid = process.env.NEXT_PUBLIC_USER_UUID;
  const buskerAccessToken = process.env.NEXT_PUBLIC_BUSKER_ACCESS_TOKEN;
  const buskerUuid = process.env.NEXT_PUBLIC_BUSKER_UUID;

  // 디버깅용 로그
  console.log('Environment variables:', {
    userAccessToken: userAccessToken ? 'Set' : 'Not set',
    userUuid: userUuid ? 'Set' : 'Not set',
    buskerAccessToken: buskerAccessToken ? 'Set' : 'Not set',
    buskerUuid: buskerUuid ? 'Set' : 'Not set',
  });

  // 토큰 값 확인 (개발용)
  if (userAccessToken) {
    console.log('User token preview:', userAccessToken.substring(0, 20) + '...');
  }
  if (userUuid) {
    console.log('User UUID:', userUuid);
  }

  useEffect(() => {
    if (!streamKey) return;

    const fetchData = async () => {
      try {
        const [liveDetail, categoryList] = await Promise.all([
          getLiveDetail(streamKey, userUuid!, userAccessToken!),
          getCategoryList(userAccessToken!, userUuid!),
        ]);
        setLive(liveDetail.live);
        setCategories(categoryList.result);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (userUuid && userAccessToken) {
      fetchData();
    }
  }, [streamKey, userUuid, userAccessToken]);

  useEffect(() => {
    if (!streamKey) return;
    
    // WebSocket 연결에 지연 추가
    const connectWebSocket = () => {
      const token = isHost ? buskerAccessToken : userAccessToken;
      if (!token) {
        console.error('❌ WebSocket 연결 실패: 토큰이 없습니다');
        return;
      }
      
      const wsUrl = `wss://back.vybz.kr/ws-live/viewer?streamKey=${streamKey}&token=${token}`;
      console.log("Connecting to WebSocket with URL:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;
      
      ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공!');
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket 연결 에러:', error);
      };
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket 연결 종료:', event.code, event.reason);
      };
      
      ws.onmessage = (e) => {
        console.log('📨 WebSocket 메시지 수신:', e.data);
        if (e.data === "스트림이 종료되었습니다.") setIsEnded(true);
      };
    };
    
    // 1초 지연 후 WebSocket 연결 시도
    const timeoutId = setTimeout(connectWebSocket, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [streamKey, isHost, buskerAccessToken, userAccessToken]);

  useEffect(() => {
    if (!streamKey || !videoRef.current) return;
    // 프록시를 통해 HLS 스트림에 접근
    const streamUrl = `http://13.124.91.96:8090/hls/${streamKey}.m3u8`;
    const video = videoRef.current;
    const tryLoad = () => {
      fetch(streamUrl)
        .then((res) => {
          if (res.ok) {
            if (Hls.isSupported()) {
              const hls = new Hls();
              hls.loadSource(streamUrl);
              hls.attachMedia(video);
              setIsLoading(false);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
              video.src = streamUrl;
              setIsLoading(false);
            }
          } else {
            setTimeout(tryLoad, 1000);
          }
        })
        .catch(() => setTimeout(tryLoad, 1000));
    };
    tryLoad();
  }, [streamKey]);

  useEffect(() => {
    if (isEnded && videoRef.current) {
      const video = videoRef.current;
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
  }, [isEnded]);

  const handleExit = async () => {
    if (!userUuid) return;
    await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/exit?streamKey=${streamKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": userUuid },
    });
    socketRef.current?.close();
    router.push("/");
  };

  useEffect(() => {
    const handleUnload = async () => {
      if (!userUuid) return;
      await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/exit?streamKey=${streamKey}`, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json", "X-User-Id": userUuid },
      });
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [streamKey, userUuid]);

  const handleEnd = async () => {
    if (!buskerUuid) return;
    await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/end?streamKey=${streamKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Busker-Id": buskerUuid },
    });
    socketRef.current?.close();
    setIsEnded(true);
  };

  const categoryName =
    live && categories.length > 0
      ? categories.find((cat) => cat.id === live.categoryId)?.name
      : undefined;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h2 className="text-xl mb-2">
        {isLoading
          ? "방송 정보 불러오는 중..."
          : live
          ? `📺 ${live.title} (시청자 ${live.viewerCount}명)`
          : "방송 정보를 찾을 수 없습니다."}
      </h2>
      {live && (
        <div className="mb-2 text-gray-300 text-sm">
          <span>호스트: {live.buskerUuid}</span>
          {categoryName && <span className="ml-2">카테고리: {categoryName}</span>}
        </div>
      )}
      {isEnded ? (
        <div className="text-red-400 font-bold text-2xl mt-8">🛑 방송이 종료되었습니다</div>
      ) : (
        <>
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-[640px] h-[360px] bg-gray-800 mb-4"
          />
          {isHost && !isLoading && (
            <button
              onClick={handleEnd}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-semibold"
            >
              🛑 방송 종료
            </button>
          )}
          {!isHost && !isEnded && (
            <button
              onClick={handleExit}
              className="absolute top-4 right-4 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
            >
              ❌ 나가기
            </button>
          )}
        </>
      )}
    </div>
  );
}