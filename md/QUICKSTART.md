# 🚀 백엔드 + 프론트엔드 통합 실행 가이드

## 📋 준비사항

1. **Node.js 18 이상** 설치
2. **MongoDB** 설치 및 실행
3. **Git** 설치 (선택)

## 🔧 1단계: MongoDB 설치 및 실행

### Windows에서 MongoDB 설치

#### 방법 1: MongoDB Community Edition
1. [MongoDB 다운로드](https://www.mongodb.com/try/download/community)
2. 설치 프로그램 실행
3. "Complete" 설치 선택
4. "Install MongoDB as a Service" 체크

#### 방법 2: MongoDB 서비스로 실행
\`\`\`powershell
# MongoDB 서비스 시작
net start MongoDB

# MongoDB 서비스 상태 확인
sc query MongoDB

# MongoDB 서비스 중지
net stop MongoDB
\`\`\`

#### 방법 3: 직접 실행
\`\`\`powershell
# MongoDB 데이터 디렉토리 생성
mkdir C:\data\db

# MongoDB 실행
mongod
\`\`\`

## 🖥️ 2단계: 백엔드 서버 설정

\`\`\`powershell
# 프로젝트 루트에서 server 폴더로 이동
cd server

# 의존성 설치
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install

# 환경 변수 설정
Copy-Item .env.example .env

# .env 파일 편집
notepad .env
\`\`\`

### .env 파일 설정 (최소 필수 항목)

\`\`\`env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/community-board
JWT_SECRET=랜덤한_비밀키_32자_이상_입력하세요
SESSION_SECRET=또다른_랜덤_비밀키_32자_이상
CLIENT_URL=http://localhost:5173

# Cloudinary (선택사항 - 나중에 설정 가능)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth (선택사항)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth (선택사항)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
\`\`\`

### 백엔드 서버 실행

\`\`\`powershell
# 개발 모드 (자동 재시작)
npm run dev

# 또는 프로덕션 모드
npm start
\`\`\`

서버가 정상적으로 실행되면:
\`\`\`
✅ MongoDB 연결 성공
Server running on http://localhost:5000
\`\`\`

## 🎨 3단계: 프론트엔드 설정

**새 터미널 창을 열고:**

\`\`\`powershell
# 프로젝트 루트로 이동
cd ..

# 환경 변수 확인
# .env 파일이 이미 생성되어 있어야 함
Get-Content .env

# 프론트엔드 실행
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
\`\`\`

브라우저에서 자동으로 열리거나 수동으로 접속:
\`\`\`
http://localhost:5173
\`\`\`

## ✅ 4단계: 작동 확인

### 백엔드 API 테스트
\`\`\`powershell
# 새 터미널에서
curl http://localhost:5000
# 응답: {"message":"🚀 Community Board API Server"}
\`\`\`

### 프론트엔드-백엔드 연결 확인
1. 브라우저에서 `http://localhost:5173` 접속
2. F12 (개발자 도구) 열기
3. Console 탭에서 Socket.IO 연결 확인:
   - ✅ `Socket.IO 연결됨: [socket-id]`

## 🎯 5단계: 기능 테스트

### 회원가입 테스트
1. "회원가입" 버튼 클릭
2. 정보 입력 및 제출
3. 자동 로그인 확인

### 게시글 작성 테스트
1. 게시판 선택
2. "글쓰기" 클릭
3. 제목/내용 입력
4. 작성 버튼 클릭
5. 목록에서 게시글 확인

### 실시간 기능 테스트
1. 2개의 브라우저 탭 열기
2. 한 탭에서 게시글 작성
3. 다른 탭에서 실시간 업데이트 확인

## 🐛 문제 해결

### MongoDB 연결 오류
\`\`\`
❌ MongoDB 연결 실패
\`\`\`

**해결방법:**
1. MongoDB 서비스 실행 확인
   \`\`\`powershell
   sc query MongoDB
   \`\`\`
2. MongoDB 포트 확인 (기본 27017)
3. .env의 MONGODB_URI 확인

### 포트 이미 사용 중
\`\`\`
Error: listen EADDRINUSE: address already in use :::5000
\`\`\`

**해결방법:**
\`\`\`powershell
# 포트 5000 사용 프로세스 확인
netstat -ano | findstr :5000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
taskkill /PID [PID번호] /F
\`\`\`

### CORS 오류
\`\`\`
Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS policy
\`\`\`

**해결방법:**
1. 백엔드 .env에서 CLIENT_URL 확인:
   \`\`\`env
   CLIENT_URL=http://localhost:5173
   \`\`\`
2. 백엔드 서버 재시작

### Socket.IO 연결 실패

**해결방법:**
1. 백엔드 서버 실행 확인
2. 프론트엔드 .env 확인:
   \`\`\`env
   VITE_SOCKET_URL=http://localhost:5000
   \`\`\`
3. 프론트엔드 재시작

### PowerShell 스크립트 실행 오류
\`\`\`
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded
\`\`\`

**해결방법:**
\`\`\`powershell
# 현재 프로세스에만 실행 정책 변경
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
\`\`\`

## 📊 실행 확인 체크리스트

- [ ] MongoDB 서비스 실행 중
- [ ] 백엔드 서버 실행 (포트 5000)
- [ ] 프론트엔드 서버 실행 (포트 5173)
- [ ] 백엔드 API 응답 확인
- [ ] Socket.IO 연결 확인
- [ ] 회원가입/로그인 작동
- [ ] 게시글 작성/조회 작동

## 🎉 성공!

모든 단계가 완료되면 다음을 할 수 있습니다:

- ✅ 회원가입 및 로그인
- ✅ 게시글 CRUD (작성/읽기/수정/삭제)
- ✅ 댓글 및 대댓글
- ✅ 좋아요 및 스크랩
- ✅ 실시간 알림 (Socket.IO)
- ✅ 이미지 업로드 (Cloudinary 설정 시)
- ✅ 다크 모드
- ✅ PWA 오프라인 지원

## 🚀 다음 단계

### Cloudinary 이미지 업로드 활성화
1. [Cloudinary 가입](https://cloudinary.com/)
2. Dashboard에서 인증 정보 확인
3. server/.env에 추가:
   \`\`\`env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   \`\`\`
4. 백엔드 재시작

### Google OAuth 로그인 활성화
1. [Google Cloud Console](https://console.cloud.google.com/)
2. 새 프로젝트 생성
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 리디렉션 URI: \`http://localhost:5000/api/auth/google/callback\`
5. server/.env에 추가

### GitHub OAuth 로그인 활성화
1. GitHub Settings > Developer settings > OAuth Apps
2. New OAuth App
3. Authorization callback URL: \`http://localhost:5000/api/auth/github/callback\`
4. server/.env에 추가

## 📚 추가 자료

- [MongoDB 공식 문서](https://docs.mongodb.com/)
- [Express 가이드](https://expressjs.com/en/guide/routing.html)
- [Socket.IO 문서](https://socket.io/docs/)
- [Cloudinary 문서](https://cloudinary.com/documentation)

---

**문제가 발생하면 GitHub Issues에 등록해주세요!**
