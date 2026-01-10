# 🚨 404 에러 해결 가이드

## 현재 상황
프론트엔드에서 다음 에러가 발생:
```
게시글 로드 실패: Error: 서버 응답 오류: 404
```

백엔드 테스트 결과:
```bash
# ✅ 백엔드 루트는 작동함
curl https://inside-live-backend.vercel.app/
# 응답: {"message":"🚀 Community Board API Server","status":"running"}

# ❌ API 엔드포인트는 404
curl https://inside-live-backend.vercel.app/api/posts
# 응답: {"error":"Not Found","message":"경로를 찾을 수 없습니다: /api/posts"}
```

## 원인 분석

API 라우트가 등록되지 않은 이유는 **Vercel 환경 변수 미설정** 때문입니다.

`server/server.js`의 라우트 로딩 코드:
```javascript
try {
  const authRoutes = require('./routes/auth');
  const postRoutes = require('./routes/posts');
  // ... 라우트 로드
  
  const apiPrefix = isVercel ? '' : '/api';
  app.use(`${apiPrefix}/posts`, postRoutes);
  // ... 라우트 등록
} catch (error) {
  console.error('❌ 라우트 로딩 실패:', error.message);
}
```

**라우트 로딩 실패 가능성**:
1. `MONGODB_URI` 미설정으로 인한 models 로드 실패
2. 환경 변수 부재로 인한 middleware 초기화 실패
3. 의존성 패키지 누락

## 해결 방법

### 1단계: Vercel 환경 변수 설정 (필수)

#### Backend 프로젝트 설정
[Vercel Dashboard](https://vercel.com/dashboard) → **inside-live-backend** 프로젝트 선택

**Settings → Environment Variables**에서 다음 변수 추가:

**🔴 필수 환경 변수:**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
CLIENT_URL=https://your-frontend.vercel.app
SESSION_SECRET=your_session_secret_key_minimum_32_characters
```

**⚠️ 중요**: `<db_password>` 부분을 실제 MongoDB 비밀번호로 교체하세요!

**🟡 OAuth 사용 시 (선택):**
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-backend.vercel.app/api/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://your-backend.vercel.app/api/auth/github/callback
```

**🟢 이메일 기능 사용 시 (선택):**
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

**🔵 파일 업로드 사용 시 (선택):**
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Frontend 프로젝트 설정
[Vercel Dashboard](https://vercel.com/dashboard) → **inside-live** 프로젝트 선택

**Settings → Environment Variables**:
```
VITE_API_URL=https://your-backend.vercel.app/api
```
**⚠️ 중요**: `/api`를 반드시 포함해야 합니다!

> **참고**: `your-backend`와 `your-frontend` 부분을 실제 Vercel 프로젝트 URL로 교체하세요.

### 2단계: 백엔드 재배포

환경 변수 설정 후:

1. **Vercel Dashboard** → **inside-live-backend** 프로젝트
2. **Deployments** 탭
3. 최신 배포의 **⋯** 메뉴 → **Redeploy**
4. **Redeploy** 버튼 클릭

또는 코드 푸시로 재배포:
```bash
cd server
git add .
git commit -m "Trigger redeploy" --allow-empty
git push
```

### 3단계: 배포 확인

#### 백엔드 테스트
```bash
# 1. 루트 엔드포인트
curl https://inside-live-backend.vercel.app/
# 예상: {"message":"🚀 Community Board API Server","status":"running"}

# 2. API 엔드포인트 (이제 작동해야 함!)
curl https://inside-live-backend.vercel.app/api/posts
# 예상: {"posts":[...]}
```

#### 프론트엔드 테스트
1. https://inside-live.vercel.app 접속
2. 브라우저 콘솔(F12) 확인
3. 에러 메시지가 사라져야 함

### 4단계: Vercel 로그 확인

배포 후에도 문제가 계속되면:

1. **Vercel Dashboard** → **inside-live-backend**
2. **Deployments** → 최신 배포 클릭
3. **Functions** 탭 → `api/index.js` 클릭
4. 로그에서 다음 메시지 확인:
   - ✅ `MongoDB 연결 성공`
   - ✅ `모든 라우터 등록 완료`
   - ❌ 에러 메시지가 있다면 해당 내용 확인

## 일반적인 에러 패턴

### 에러 1: MongoDB 연결 실패
```
❌ MONGODB_URI 환경 변수가 설정되지 않았습니다
```
**해결**: Vercel에서 `MONGODB_URI` 환경 변수 설정 후 재배포

### 에러 2: 라우트 로딩 실패
```
❌ 라우트 로딩 실패: Cannot find module './models/Post'
```
**해결**: 
- `server/package.json`의 dependencies 확인
- Vercel Build 설정에서 Root Directory가 `server`로 설정되었는지 확인

### 에러 3: CORS 에러
```
Access to fetch at 'https://inside-live-backend.vercel.app/api/posts' from origin 
'https://inside-live.vercel.app' has been blocked by CORS policy
```
**해결**: `CLIENT_URL` 환경 변수가 올바른지 확인

## 빠른 체크리스트

- [ ] Vercel Backend에 `MONGODB_URI` 설정됨
- [ ] Vercel Backend에 `JWT_SECRET` 설정됨  
- [ ] Vercel Backend에 `CLIENT_URL` 설정됨
- [ ] Vercel Frontend에 `VITE_API_URL` 설정됨 (반드시 `/api` 포함!)
- [ ] Backend 재배포 완료
- [ ] Frontend 재배포 완료 (환경 변수 변경 시)
- [ ] `curl https://inside-live-backend.vercel.app/api/posts` 테스트 성공
- [ ] 브라우저 콘솔에 404 에러 없음

## 추가 도움

문제가 지속되면:
1. Vercel Deployment 로그 캡처
2. 브라우저 Network 탭 캡처
3. 에러 메시지 전문 확인

---

**참고**: 이 가이드는 Vercel serverless 환경의 특성상 환경 변수 설정이 필수임을 기반으로 작성되었습니다.
