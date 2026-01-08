# Vercel 배포 가이드

## 배포 전 준비사항

### 1. MongoDB Atlas 설정
1. MongoDB Atlas (https://cloud.mongodb.com) 접속
2. **Network Access** 메뉴에서 IP 화이트리스트에 `0.0.0.0/0` 추가
3. **Database** → **Connect** → Connection String 복사
4. 예시: `mongodb+srv://<username>:<password>@cluster.mongodb.net/community-board`

### 2. Google OAuth 설정
1. Google Cloud Console (https://console.cloud.google.com) 접속
2. **APIs & Services** → **Credentials** → OAuth 2.0 클라이언트 선택
3. **승인된 리디렉션 URI** 추가:
   ```
   https://your-backend-url.vercel.app/api/auth/google/callback
   ```
4. **승인된 JavaScript 원본** 추가:
   ```
   https://your-frontend-url.vercel.app
   ```

### 3. GitHub OAuth 설정
1. GitHub Settings (https://github.com/settings/developers) 접속
2. OAuth Apps → 해당 앱 선택
3. **Authorization callback URL** 업데이트:
   ```
   https://your-backend-url.vercel.app/api/auth/github/callback
   ```
4. **Homepage URL**:
   ```
   https://your-frontend-url.vercel.app
   ```

## Vercel 배포 단계

### Step 1: 백엔드 배포

1. Vercel 대시보드에서 **New Project** 클릭
2. GitHub 레포지토리 선택
3. **프로젝트 이름**: `insidelive-backend` (또는 원하는 이름)
4. **Root Directory**: `server` 선택
5. **Environment Variables** 추가:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/community-board?retryWrites=true&w=majority
JWT_SECRET=sdfygqweuhohhfqwogy2893i28ijffsdfwer3123r35
SESSION_SECRET=sK8mP2nQ5rT9wY3xB6vC1hN4jL7fD0aE9gU2iO5pM8qR1tY4wX7zA3sF6hK9bN2vC

CLOUDINARY_CLOUD_NAME=dnb3nbzc0
CLOUDINARY_API_KEY=777658276336994
CLOUDINARY_API_SECRET=K7yKlpP_HJ4PMjBFNI8TMsCIGTc

EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-url.vercel.app/api/auth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://your-backend-url.vercel.app/api/auth/github/callback

CLIENT_URL=https://your-frontend-url.vercel.app
```

6. **Deploy** 클릭
7. 배포 완료 후 URL 복사 (예: `https://insidelive-backend.vercel.app`)

### Step 2: 프론트엔드 배포

1. Vercel 대시보드에서 **New Project** 클릭
2. 같은 GitHub 레포지토리 선택
3. **프로젝트 이름**: `insidelive-frontend` (또는 원하는 이름)
4. **Root Directory**: `.` (루트 디렉토리)
5. **Framework Preset**: Vite 선택
6. **Environment Variables** 추가:

```env
VITE_API_URL=https://insidelive-backend.vercel.app/api
VITE_SOCKET_URL=https://insidelive-backend.vercel.app
```

7. **Deploy** 클릭
8. 배포 완료 후 URL 복사 (예: `https://insidelive-frontend.vercel.app`)

### Step 3: 백엔드 환경 변수 업데이트

백엔드 Vercel 프로젝트로 돌아가서 다음 환경 변수들을 **실제 URL로 업데이트**:

```env
GOOGLE_CALLBACK_URL=https://insidelive-backend.vercel.app/api/auth/google/callback
GITHUB_CALLBACK_URL=https://insidelive-backend.vercel.app/api/auth/github/callback
CLIENT_URL=https://insidelive-frontend.vercel.app
```

**Redeploy** 클릭하여 변경사항 적용

### Step 4: OAuth 설정 최종 업데이트

#### Google OAuth
1. Google Cloud Console에서 승인된 리디렉션 URI에 **실제 백엔드 URL** 추가
2. 승인된 JavaScript 원본에 **실제 프론트엔드 URL** 추가

#### GitHub OAuth
1. GitHub OAuth 설정에서 Authorization callback URL을 **실제 백엔드 URL**로 변경
2. Homepage URL을 **실제 프론트엔드 URL**로 변경

## 배포 후 확인사항

✅ 프론트엔드 접속 확인  
✅ 로그인/회원가입 동작 확인  
✅ Google OAuth 로그인 테스트  
✅ GitHub OAuth 로그인 테스트  
✅ 게시글 작성/조회 테스트  
✅ 메시지 전송 테스트  
✅ 이미지 업로드 테스트  

## 문제 해결

### CORS 에러 발생 시
- 백엔드의 `CLIENT_URL` 환경 변수가 정확한지 확인
- 프론트엔드 URL이 정확히 일치하는지 확인 (후행 슬래시 주의)

### OAuth 로그인 실패 시
- Google/GitHub 콘솔에서 콜백 URL이 정확한지 확인
- 환경 변수의 `GOOGLE_CALLBACK_URL`, `GITHUB_CALLBACK_URL` 확인

### MongoDB 연결 실패 시
- MongoDB Atlas Network Access에 `0.0.0.0/0` 추가 확인
- Connection String 형식 확인
- 사용자 권한 확인

### 빌드 실패 시
- `package.json`의 빌드 명령어 확인
- Node.js 버전 호환성 확인
- 환경 변수 누락 여부 확인

## 주의사항

⚠️ `.env` 파일은 절대 Git에 커밋하지 마세요  
⚠️ 모든 시크릿 키는 Vercel 환경 변수로 관리  
⚠️ 프로덕션 환경에서는 반드시 HTTPS 사용  
⚠️ MongoDB Atlas는 무료 티어 제한 (512MB) 주의  

## 유용한 명령어

### 로컬에서 프로덕션 빌드 테스트
```bash
# 프론트엔드
npm run build
npm run preview

# 백엔드
cd server
npm start
```

### Vercel CLI 사용
```bash
npm install -g vercel
vercel login
vercel --prod
```
