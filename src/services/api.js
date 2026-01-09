// API 기본 URL (끝에 슬래시 없이)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 토큰 관리
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

const getRefreshToken = () => {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
};
const setRefreshToken = (token, rememberMe = false) => {
  if (rememberMe) {
    localStorage.setItem('refreshToken', token);
    sessionStorage.removeItem('refreshToken');
  } else {
    sessionStorage.setItem('refreshToken', token);
    localStorage.removeItem('refreshToken');
  }
};
const removeRefreshToken = () => {
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('refreshToken');
};

// HTTP 헤더 생성
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// API 요청 헬퍼
const apiRequest = async (url, options = {}) => {
  try {
    // URL 정규화: 이중 슬래시 방지
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `${API_URL}${normalizedUrl}`;
    
    console.log('🌐 API 요청:', fullUrl);
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...getHeaders(options.auth !== false),
        ...options.headers
      },
      credentials: 'include' // CORS 쿠키 포함
    });

    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ JSON이 아닌 응답:', text.substring(0, 500));
      throw new Error(`서버가 JSON이 아닌 응답을 반환했습니다: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      // 토큰 만료 시 자동 갱신 시도
      if (response.status === 401 && data.message?.includes('만료')) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // 원래 요청 재시도
          return apiRequest(url, options);
        }
      }
      
      throw new Error(data.message || '요청 처리 중 오류가 발생했습니다.');
    }

    return data;
  } catch (error) {
    console.error('❌ API Request Error:', error);
    throw error;
  }
};

// 토큰 갱신
const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) return false;

    const data = await response.json();
    setToken(data.token);
    return true;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
};

// ==================== 인증 API ====================

export const authAPI = {
  // 회원가입
  register: async (username, email, password, name, rememberMe = true) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ username, email, password, name })
    });
    
    setToken(data.token);
    setRefreshToken(data.refreshToken, rememberMe);
    return data;
  },

  // 로그인
  login: async (username, password, rememberMe = false) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ username, password })
    });
    
    setToken(data.token);
    setRefreshToken(data.refreshToken, rememberMe);
    return data;
  },

  // 로그아웃
  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
      removeRefreshToken();
    }
  },

  // 현재 사용자 정보
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  // 계정 찾기 (이메일로 사용자명 찾기)
  findAccount: async (email) => {
    return await apiRequest('/auth/find-account', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email })
    });
  },

  // 비밀번호 재설정
  resetPassword: async (email, newPassword) => {
    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, newPassword })
    });
  },

  // 사용자명 중복 확인
  checkUsername: async (username) => {
    return await apiRequest('/auth/check-username', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ username })
    });
  },

  // OAuth 로그인 URL
  getGoogleAuthUrl: () => `${API_URL.replace('/api', '')}/api/auth/google`,
  getGithubAuthUrl: () => `${API_URL.replace('/api', '')}/api/auth/github`
};

// ==================== 게시글 API ====================

export const postsAPI = {
  // 게시글 목록
  getPosts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/posts?${query}`, { auth: false });
  },

  // 게시글 상세
  getPost: async (uuid) => {
    return await apiRequest(`/posts/${uuid}`, { auth: false });
  },

  // 게시글 작성
  createPost: async (postData) => {
    return await apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  },

  // 게시글 수정
  updatePost: async (uuid, postData) => {
    return await apiRequest(`/posts/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
  },

  // 게시글 삭제
  deletePost: async (uuid) => {
    return await apiRequest(`/posts/${uuid}`, { method: 'DELETE' });
  },

  // 좋아요/취소
  toggleLike: async (uuid) => {
    return await apiRequest(`/posts/${uuid}/like`, { method: 'POST' });
  },

  // 스크랩/취소
  toggleScrap: async (uuid) => {
    return await apiRequest(`/posts/${uuid}/scrap`, { method: 'POST' });
  }
};

// ==================== 댓글 API ====================

export const commentsAPI = {
  // 댓글 작성
  createComment: async (postUuid, content, parentId = null) => {
    return await apiRequest('/comments', {
      method: 'POST',
      body: JSON.stringify({ postUuid, content, parentId })
    });
  },

  // 댓글 수정
  updateComment: async (id, postUuid, content, isReply = false, parentId = null) => {
    return await apiRequest(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ postUuid, content, isReply, parentId })
    });
  },

  // 댓글 삭제
  deleteComment: async (id, postUuid, isReply = false, parentId = null) => {
    const query = new URLSearchParams({ postUuid, isReply, parentId }).toString();
    return await apiRequest(`/comments/${id}?${query}`, { method: 'DELETE' });
  }
};

// ==================== 사용자 API ====================

export const usersAPI = {
  // 사용자 정보
  getUser: async (id) => {
    return await apiRequest(`/users/${id}`, { auth: false });
  },

  // 사용자 정보 수정
  updateUser: async (id, userData) => {
    return await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  // 계정 삭제
  deleteUser: async (id) => {
    return await apiRequest(`/users/${id}`, { method: 'DELETE' });
  },

  // 사용자 작성 게시글
  getUserPosts: async (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/users/${id}/posts?${query}`, { auth: false });
  },

  // 즐겨찾기 조회
  getFavorites: async (id) => {
    return await apiRequest(`/users/${id}/favorites`);
  },

  // 즐겨찾기 추가/제거
  toggleFavorite: async (id, board) => {
    return await apiRequest(`/users/${id}/favorites`, {
      method: 'POST',
      body: JSON.stringify({ board })
    });
  },

  // 스크랩 목록
  getScraps: async (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/users/${id}/scraps?${query}`);
  }
};

// ==================== 업로드 API ====================

export const uploadAPI = {
  // 단일 파일 업로드
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getToken();
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || '파일 업로드 실패');
    }

    return await response.json();
  },

  // 여러 파일 업로드
  uploadFiles: async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const token = getToken();
    const response = await fetch(`${API_URL}/upload/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || '파일 업로드 실패');
    }

    return await response.json();
  },

  // 파일 삭제
  deleteFile: async (publicId, resourceType = 'image') => {
    return await apiRequest(`/upload/${encodeURIComponent(publicId)}?resourceType=${resourceType}`, {
      method: 'DELETE'
    });
  }
};

// 토큰 관리 함수 export
export { getToken, setToken, removeToken, getRefreshToken, setRefreshToken, removeRefreshToken };
