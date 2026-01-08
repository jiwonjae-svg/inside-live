# 🚀 백엔드 서버 설치 가이드

## 사전 요구사항

- Node.js 18+ 설치
- MongoDB 설치 및 실행
- Git 설치

## 1. MongoDB 설치 (Windows)

### 방법 1: MongoDB Community Edition
1. [MongoDB 다운로드](https://www.mongodb.com/try/download/community)
2. 설치 프로그램 실행
3. "Complete" 설치 선택
4. "Install MongoDB as a Service" 체크
5. MongoDB Compass 설치 (옵션)

### 방법 2: Docker 사용
\`\`\`powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
\`\`\`

## 2. 백엔드 서버 설치

\`\`\`powershell
# 프로젝트 루트에서
cd server

# 패키지 설치
npm install

# 환경 변수 설정
Copy-Item .env.example .env

# .env 파일 편집
notepad .env
\`\`\`

## 3. 환경 변수 설정

\`.env\` 파일을 열고 다음 정보를 입력:

\`\`\`env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/community-board
JWT_SECRET=랜덤한_비밀키_여기에_입력
SESSION_SECRET=또다른_랜덤_비밀키

# Cloudinary (이미지 업로드, 나중에 설정 가능)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth (나중에 설정 가능)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# GitHub OAuth (나중에 설정 가능)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback

CLIENT_URL=http://localhost:5173
\`\`\`

## 4. 서버 실행

\`\`\`powershell
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
\`\`\`

서버가 \`http://localhost:5000\`에서 실행됩니다.

## 5. 프론트엔드 연결

프론트엔드에서 API를 사용하려면 \`src/services/api.js\` 파일을 생성:

\`\`\`javascript
const API_URL = 'http://localhost:5000/api';

export const api = {
  // 게시글 API
  getPosts: async (category) => {
    const response = await fetch(\`\${API_URL}/posts?category=\${category}\`);
    return response.json();
  },
  
  createPost: async (postData, token) => {
    const response = await fetch(\`\${API_URL}/posts\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify(postData)
    });
    return response.json();
  },
  
  // ... 추가 API 메서드
};
\`\`\`

## 6. Cloudinary 설정 (이미지 업로드)

1. [Cloudinary 가입](https://cloudinary.com/)
2. Dashboard에서 Cloud Name, API Key, API Secret 확인
3. \`.env\` 파일에 추가

## 7. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. "API 및 서비스" > "사용자 인증 정보"
4. "OAuth 2.0 클라이언트 ID" 생성
5. 승인된 리디렉션 URI에 \`http://localhost:5000/auth/google/callback\` 추가
6. Client ID와 Client Secret을 \`.env\`에 추가

## 8. GitHub OAuth 설정

1. GitHub Settings > Developer settings > OAuth Apps
2. "New OAuth App" 클릭
3. Authorization callback URL: \`http://localhost:5000/auth/github/callback\`
4. Client ID와 Client Secret을 \`.env\`에 추가

## 9. 테스트

\`\`\`powershell
# API 테스트
curl http://localhost:5000

# 게시글 목록 조회
curl http://localhost:5000/api/posts
\`\`\`

## 10. 프로덕션 배포

### Heroku 배포
\`\`\`bash
heroku create your-app-name
heroku config:set MONGODB_URI="your-mongodb-atlas-uri"
git push heroku main
\`\`\`

### Vercel 배포
1. \`vercel.json\` 파일 생성
2. \`vercel\` 명령어 실행

### Docker 배포
\`\`\`bash
docker build -t community-board-server .
docker run -p 5000:5000 community-board-server
\`\`\`

## 문제 해결

### MongoDB 연결 오류
- MongoDB 서비스가 실행 중인지 확인
- \`.env\`의 \`MONGODB_URI\` 확인

### 포트 이미 사용 중
\`\`\`powershell
# 포트 5000 사용 프로세스 확인
netstat -ano | findstr :5000

# 프로세스 종료
taskkill /PID <PID번호> /F
\`\`\`

### CORS 오류
- \`server.js\`에서 \`CLIENT_URL\` 확인
- 브라우저에서 \`http://localhost:5173\` 사용

## 추가 자료

- [Express 공식 문서](https://expressjs.com/)
- [MongoDB 공식 문서](https://docs.mongodb.com/)
- [Socket.IO 가이드](https://socket.io/docs/)
- [Passport.js 문서](http://www.passportjs.org/)
