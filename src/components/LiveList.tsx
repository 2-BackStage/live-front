'use client';

import { useState } from 'react';

type LiveItem = {
  streamKey: string;
  title: string;
  buskerUuid: string;
  thumbnailUrl: string;
  viewerCount: number;
  liveStreamStatus: string;
  startedAt: string;
};

type ScrollLiveResponse = {
  content: LiveItem[];
  hasNext: boolean;
  nextCursor: string;
};

export default function LiveList({ initialData }: { initialData: ScrollLiveResponse }) {
  const [lives, setLives] = useState<LiveItem[]>(initialData.content);
  const [lastId, setLastId] = useState<string | null>(initialData.nextCursor || null);
  const [hasNext, setHasNext] = useState(initialData.hasNext);
  const [loading, setLoading] = useState(false);

  const fetchLives = async () => {
    if (loading || !hasNext) return;

    setLoading(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/all`);
      url.searchParams.append('lastId', lastId ?? '');
      url.searchParams.append('size', '10');

      const res = await fetch(url.toString());

      if (!res.ok) {
        throw new Error('라이브 방송 목록을 불러오는 데 실패했습니다.');
      }

      const data = await res.json();
      const { content, hasNext: next, nextCursor } = data.result;

      setLives((prev) => [...prev, ...content]);
      setHasNext(next);
      setLastId(nextCursor);
    } catch (err) {
      console.error('라이브 방송 목록 로딩 실패', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {lives.map((live) => (
          <a
            key={live.streamKey}
            href={`/live/view/${live.streamKey}`}
            className="block rounded-xl overflow-hidden shadow-lg border border-white hover:shadow-xl transition"
          >
            <img
              src={live.thumbnailUrl || '/default-thumbnail.jpg'}
              alt="썸네일"
              className="w-full h-40 object-cover"
            />
            <div className="p-2">
              <p className="font-semibold truncate" title={live.title}>{live.title}</p>
              <p className="text-sm text-gray-400 truncate">👤 {live.buskerUuid}</p>
              <p className="text-sm text-red-500">🔴 {live.viewerCount}명 시청 중</p>
            </div>
          </a>
        ))}
      </div>

      {hasNext && (
        <div className="flex justify-center mt-6">
          <button
            onClick={fetchLives}
            disabled={loading}
            className={`px-4 py-2 text-black font-semibold rounded-lg shadow-md transition ${loading ? 'bg-gray-400' : 'bg-white hover:bg-gray-100'}`}
          >
            {loading ? '불러오는 중...' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  );
}
