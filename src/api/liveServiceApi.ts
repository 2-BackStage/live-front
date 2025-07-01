import type {
  LiveListResponse,
  LiveDetailResponse,
  StopLiveRequest,
  StopLiveResponse,
  CategoryListResponse,
} from '../types/liveServiceApi';

const BASE_URL = 'http://3.38.58.133:8000/live-service/api/v1';

export async function getLiveList(accessToken: string, categoryId: number = 1, size: number = 10): Promise<LiveListResponse> {
  const url = new URL(`${BASE_URL}/live/all`);
  url.searchParams.append('categoryId', categoryId.toString());
  url.searchParams.append('size', size.toString());
  
  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch live list');
  const data = await res.json();
  return { lives: data.result.content };
}

export async function getLiveDetail(streamKey: string, userUuid: string, accessToken: string): Promise<LiveDetailResponse> {
  const url = `${BASE_URL}/live/enter/${streamKey}`;
  console.log('🔍 getLiveDetail API 호출:', {
    url,
    userUuid,
    headers: { 
      'X-User-Id': userUuid,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const res = await fetch(url, {
    headers: {
      'X-User-Id': userUuid,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  console.log('📡 getLiveDetail 응답:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ getLiveDetail 오류:', errorText);
    throw new Error(`Failed to fetch live detail: ${res.status} ${res.statusText}`);
  }
  
  return res.json();
}

export async function startLive(
  payload: { title: string; categoryId: number; membership?: boolean },
  buskerUuid: string,
  accessToken: string
): Promise<{ id: string; streamKey: string; liveStreamStatus: string; categoryId: number; membership: boolean }> {
  const res = await fetch(`${BASE_URL}/live/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Busker-Id': buskerUuid,
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to start live');
  const data = await res.json();
  return data.result;
}

export async function stopLive(
  payload: StopLiveRequest,
  buskerUuid: string,
  accessToken: string
): Promise<StopLiveResponse> {
  const res = await fetch(`${BASE_URL}/live/end?streamKey=${payload.streamKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Busker-Id': buskerUuid,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) throw new Error('Failed to stop live');
  return res.json();
}

export async function getCategoryList(accessToken: string, userUuid?: string): Promise<CategoryListResponse> {
  const url = `${BASE_URL}/live/category`;
  console.log('🔍 getCategoryList API 호출:', {
    url,
    tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'No token',
    userUuid
  });

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
  };

  // userUuid가 제공되면 X-User-Id 헤더 추가
  if (userUuid) {
    headers['X-User-Id'] = userUuid;
  }

  const res = await fetch(url, {
    headers,
  });
  
  console.log('📡 getCategoryList 응답:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ getCategoryList 오류:', errorText);
    throw new Error(`Failed to fetch category list: ${res.status} ${res.statusText}`);
  }
  
  return res.json();
} 