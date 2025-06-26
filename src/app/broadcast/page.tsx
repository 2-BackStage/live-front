"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = mediaStream;

      const response = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Busker-Id": "busker-123",
        },
        body: JSON.stringify({ title, categoryId: 1 }),
      });

      if (!response.ok) throw new Error("방송 시작 요청 실패");

      const raw = await response.json();
      const streamKey = raw.result.streamKey;
      setCurrentStreamKey(streamKey);

      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_STREAM_WS_URL}?streamKey=${streamKey}`);
      ws.binaryType = "arraybuffer";
      setSocket(ws);

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

        await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/end?streamKey=${streamKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Busker-Id": "busker-123",
          },
        });

        router.push(`/live/view/${streamKey}?host=true`);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">🎙️ 실시간 방송 시작</h1>

      {!isStreaming && (
        <input
          className="mb-2 px-4 py-2 text-black rounded"
          type="text"
          placeholder="방송 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      )}

      {errorMessage && <p className="text-red-400 mb-2">❗ {errorMessage}</p>}

      <div className="border-4 border-pink-500 rounded-xl overflow-hidden shadow-lg mb-4">
        <video ref={videoRef} autoPlay muted className="w-[640px] h-[360px] bg-black" />
      </div>

      {!isStreaming ? (
        <button
          onClick={startStreaming}
          disabled={isLoading}
          className={`px-6 py-3 rounded-full font-semibold shadow-md transition text-white ${
            isLoading ? "bg-gray-500 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-500"
          }`}
        >
          {isLoading ? "⏳ 시작 중..." : "🚀 방송 시작"}
        </button>
      ) : (
        <>
          <p className="text-green-400 font-medium mt-2">✅ 스트리밍 중입니다...</p>
          <button
            onClick={endStreaming}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-semibold"
          >
            🛑 방송 종료
          </button>
        </>
      )}
    </div>
  );
}
