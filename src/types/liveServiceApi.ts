// 라이브 정보 타입
export interface Live {
  streamKey: string;
  title: string;
  buskerUuid: string;
  thumbnailUrl: string | null;
  viewerCount: number;
  liveStreamStatus: string;
  startedAt: string;
  categoryId: number;
}

// 라이브 목록 응답
export interface LiveListResponse {
  lives: Live[];
}

// 라이브 상세 응답
export interface LiveDetailResponse {
  live: Live;
  description?: string;
}

// 라이브 시작 요청
export interface StartLiveRequest {
  title: string;
  host: string;
  categoryId?: number;
}

// 라이브 시작 응답
export interface StartLiveResponse {
  streamKey: string;
  status: 'live' | 'scheduled';
}

// 라이브 종료 요청
export interface StopLiveRequest {
  streamKey: string;
}

// 라이브 종료 응답
export interface StopLiveResponse {
  streamKey: string;
  status: 'ended';
}

// 카테고리 타입
export interface Category {
  id: number;
  name: string;
}

// 카테고리 리스트 응답
export interface CategoryListResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: Category[];
} 