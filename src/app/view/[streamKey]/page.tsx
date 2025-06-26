"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function ViewStreamPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { streamKey } = useParams<{ streamKey: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHost = searchParams.get("host") === "true";

  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState<number | null>(null);

  useEffect(() => {
    if (!streamKey) return;

    fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/enter/${streamKey}`, {
      method: "GET",
      headers: { "X-User-Id": "user-456" },
    })
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.result.title);
        setViewerCount(data.result.viewerCount);
      })
      .catch(console.error);
  }, [streamKey]);

  useEffect(() => {
    if (!streamKey) return;
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_VIEWER_WS_URL}?streamKey=${streamKey}`);
    socketRef.current = ws;

    ws.onmessage = (e) => {
      if (e.data === "스트림이 종료되었습니다.") setIsEnded(true);
    };

    return () => ws.close();
  }, [streamKey]);

  useEffect(() => {
    if (!streamKey || !videoRef.current) return;

    const streamUrl = `${process.env.NEXT_PUBLIC_HLS_BASE_URL}/${streamKey}.m3u8`;
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
    await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/exit?streamKey=${streamKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": "user-456" },
    });
    socketRef.current?.close();
    router.push("/");
  };

  useEffect(() => {
    const handleUnload = async () => {
      await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/exit?streamKey=${streamKey}`, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json", "X-User-Id": "user-456" },
      });
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [streamKey]);

  const handleEnd = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/end?streamKey=${streamKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Busker-Id": "busker-123" },
    });
    socketRef.current?.close();
    setIsEnded(true);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h2 className="text-xl mb-2">
        📺 {title ? `${title} (시청자 ${viewerCount ?? 0}명)` : "방송 입장 중..."}
      </h2>

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