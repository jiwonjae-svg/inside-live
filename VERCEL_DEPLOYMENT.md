# Vercel 배포 환경 변수 체크리스트

## 백엔드 (inside-live-backend)

### 필수 환경 변수
- ✅ `MONGODB_URI` - MongoDB 연결 문자열
  ```
  mongodb+srv://username:password@cluster.mongodb.net/database
  ```

- ✅ `JWT_SECRET` - JWT 토큰 생성/검증용 비밀키
  ```
  랜덤 문자열 (최소 32자 권장)
  ```

- ✅ `CLIENT_URL` - 프론트엔드 URL (CORS 및 OAuth 리다이렉트용)
  ```
  https://inside-live.vercel.app
  ```

### 선택 환경 변수 (OAuth 사용 시)
- ⚪ `SESSION_SECRET` - 세션 암호화 키 (없으면 JWT_SECRET 사용)
- ⚪ `GOOGLE_CLIENT_ID` - Google OAuth 클라이언트 ID
- ⚪ `GOOGLE_CLIENT_SECRET` - Google OAuth 클라이언트 시크릿
- ⚪ `GOOGLE_CALLBACK_URL` - Google OAuth 콜백 URL
  ```
  https://inside-live-backend.vercel.app/api/auth/google/callback
  ```
- ⚪ `GITHUB_CLIENT_ID` - GitHub OAuth 클라이언트 ID
- ⚪ `GITHUB_CLIENT_SECRET` - GitHub OAuth 클라이언트 시크릿

### 이메일 기능 (선택)
- ⚪ `EMAIL_USER` - 이메일 발송용 계정
- ⚪ `EMAIL_PASS` - 이메일 발송용 비밀번호

### Cloudinary (이미지 업로드, 선택)
- ⚪ `CLOUDINARY_CLOUD_NAME`
- ⚪ `CLOUDINARY_API_KEY`
- ⚪ `CLOUDINARY_API_SECRET`

---

## 프론트엔드 (inside-live-frontend)

### 필수 환경 변수
- ✅ `VITE_API_URL` - 백엔드 API URL
  ```
  https://inside-live-backend.vercel.app/api
  ```
  **중요**: 반드시 `/api` 포함!

### 선택 환경 변수
- ⚪ `VITE_SOCKET_URL` - Socket.IO URL (현재 미사용)
  ```
  https://inside-live-backend.vercel.app
  ```

---

## Vercel 설정 방법

### 백엔드
1. Vercel Dashboard → inside-live-backend 프로젝트
2. Settings → General → **Root Directory**: `server`
3. Settings → Environment Variables → 위 환경 변수 추가
4. Deployments → Redeploy

### 프론트엔드
1. Vercel Dashboard → inside-live-frontend 프로젝트
2. Settings → General → **Root Directory**: `/` (루트)
3. Settings → Environment Variables → 위 환경 변수 추가
4. Deployments → Redeploy

---

## 배포 후 확인사항

### 백엔드 테스트
```bash
# 서버 상태 확인
curl https://inside-live-backend.vercel.app/

# API 상태 확인
curl https://inside-live-backend.vercel.app/api
```

예상 응답:
```json
{
  "message": "🚀 Community Board API Server",
  "status": "running",
  "timestamp": "2026-01-10T..."
}
```

### 프론트엔드 테스트
1. 브라우저에서 `https://inside-live.vercel.app` 접속
2. 개발자 도구 콘솔 확인:
   - `🔧 API Base URL:` 로그에서 올바른 URL 확인
   - `🔗 Building URL:` 로그에서 이중 슬래시 없는지 확인
3. 회원가입/로그인 테스트

---

## 문제 해결

### 404 에러
- 백엔드 URL이 `/api` 포함하는지 확인
- 프론트엔드 환경 변수에 `VITE_API_URL` 올바르게 설정됐는지 확인
- 환경 변수 변경 후 **반드시 Redeploy**

### CORS 에러
- 백엔드 환경 변수에 `CLIENT_URL` 설정 확인
- 프론트엔드 URL이 정확한지 확인

### MongoDB 연결 실패
- `MONGODB_URI` 형식 확인
- MongoDB Atlas에서 IP 화이트리스트 설정 (0.0.0.0/0 허용)
- 네트워크 액세스 권한 확인

### OAuth 실패
- OAuth 콜백 URL이 Vercel URL과 일치하는지 확인
- Google/GitHub Developer Console에서 승인된 리다이렉트 URI 설정
