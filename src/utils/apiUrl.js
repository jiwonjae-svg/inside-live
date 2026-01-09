// API URL 유틸리티
// 환경 변수에서 API URL을 가져오고 정규화합니다

// API 기본 URL 가져오기 (끝에 슬래시 제거)
export const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // 끝에 슬래시가 있으면 제거
  url = url.endsWith('/') ? url.slice(0, -1) : url;
  
  // 프로덕션이 아닐 때만 디버깅
  if (import.meta.env.MODE !== 'production') {
    console.log('🔧 API Base URL:', url);
  }
  
  return url;
};

// API URL 생성 (이중 슬래시 방지)
export const buildApiUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  // path가 /로 시작하지 않으면 추가
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${baseUrl}${normalizedPath}`;
  
  return fullUrl;
};

// 기본 export
export const API_URL = getApiBaseUrl();
