"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startLive, stopLive } from "../../api/liveServiceApi";

export default function StartStreamingPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamKey, setCurrentStreamKey] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sendQueue: Array<ArrayBuffer> = [];
  let isSending = false;

  const buskerUuid = process.env.NEXT_PUBLIC_BUSKER_UUID;
  const buskerAccessToken = process.env.NEXT_PUBLIC_BUSKER_ACCESS_TOKEN;

  const processQueue = (ws: WebSocket) => {
    if (isSending || sendQueue.length === 0 || ws.readyState !== WebSocket.OPEN) return;
    isSending = true;
    const chunk = sendQueue.shift();
    if (chunk) ws.send(chunk);
    isSending = false;
    setTimeout(() => processQueue(ws), 50);
  };

  const startStreaming = async () => {
    if (!title.trim()) {
      setErrorMessage("제목을 입력해주세요.");
      return;
    }
    if (!buskerUuid || !buskerAccessToken) {
      setErrorMessage("로그인 정보가 없습니다. 다시 로그인 해주세요.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      const res = await startLive({ title, categoryId: 1 }, buskerUuid, buskerAccessToken);
      const streamKey = res.streamKey;
      setCurrentStreamKey(streamKey);
      
      const wsUrl = `wss://back.vybz.kr/ws-live/stream?streamKey=${streamKey}&token=${buskerAccessToken}`;
      
      console.log("Connecting to WebSocket with URL:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      setSocket(ws);
      
      ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공!');
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket 연결 에러:', error);
      };
      
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          const arrayBuffer = await event.data.arrayBuffer();
          sendQueue.push(arrayBuffer);
          processQueue(ws);
        }
      };
      mediaRecorder.onstop = async () => {
        ws.close();
        setSocket(null);
        setIsStreaming(false);
        if (currentStreamKey) {
          await stopLive({ streamKey: currentStreamKey }, buskerUuid, buskerAccessToken);
        }
        router.push(`/view/${streamKey}?host=true`);
      };
      mediaRecorder.start(1000);
      setIsStreaming(true);
      
    } catch (err) {
      console.error("🔥 스트리밍 시작 실패:", err);
      setErrorMessage("스트리밍을 시작할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const endStreaming = () => mediaRecorderRef.current?.stop();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎙️ 실시간 방송 시작</h1>
          <p className="text-gray-300 text-lg">카메라와 마이크 권한을 허용하고 방송을 시작하세요</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {!isStreaming && (
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">방송 제목</label>
              <input
                className="w-full px-4 py-3 text-black rounded-lg border-2 border-white/30 focus:border-purple-400 focus:outline-none transition-colors"
                type="text"
                placeholder="방송 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
              />
              <p className="text-gray-400 text-sm mt-1">{title.length}/50</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300">❗ {errorMessage}</p>
            </div>
          )}

          <div className="relative mb-6">
            <div className="bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-purple-500">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                className="w-full h-96 object-cover" 
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">📹</div>
                    <p className="text-lg">카메라 미리보기</p>
                  </div>
                </div>
              )}
            </div>
            
            {isStreaming && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                🔴 LIVE
              </div>
            )}
          </div>

          <div className="text-center">
            {!isStreaming ? (
              <button
                onClick={startStreaming}
                disabled={isLoading}
                className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  isLoading 
                    ? "bg-gray-500 cursor-not-allowed" 
                    : "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ⏳ 시작 중...
                  </div>
                ) : (
                  "🚀 방송 시작"
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <p className="text-green-300 font-medium">✅ 스트리밍이 진행 중입니다...</p>
                </div>
                <button
                  onClick={endStreaming}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full text-white font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  🛑 방송 종료
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
