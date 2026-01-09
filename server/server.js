// Vercel에서는 환경 변수가 자동으로 로드됨
if (process.env.VERCEL !== '1') {
  const dotenv = require('dotenv');
  dotenv.config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const sanitizeInput = require('./middleware/sanitize');

const app = express();

// CORS 허용 origin 목록
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://inside-live.vercel.app',
  'https://inside-live-frontend.vercel.app',
  /^https:\/\/inside-live.*\.vercel\.app$/ // 모든 Vercel 프리뷰 배포 허용
].filter(Boolean);

console.log('🌐 허용된 CORS Origins:', allowedOrigins);

// Socket.IO는 Vercel serverless에서 지원되지 않음
// 실시간 기능은 프론트엔드에서 폴링으로 대체 필요

// 미들웨어
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: function (origin, callback) {
    // origin이 없는 경우(같은 도메인, Postman 등) 허용
    if (!origin) {
      return callback(null, true);
    }
    
    // 허용 목록 확인 (문자열 또는 정규표현식)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      // 개발 중에는 모든 origin 허용
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
}));

// Preflight 요청 처리
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// XSS 방지 - 입력 sanitization
app.use(sanitizeInput);

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// Passport 초기화 (OAuth 사용 시에만)
if (process.env.GOOGLE_CLIENT_ID || process.env.GITHUB_CLIENT_ID) {
  const passport = require('./config/passport');
  app.use(passport.initialize());
  app.use(passport.session());
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // 최대 100 요청
});
app.use('/api/', limiter);

// MongoDB 연결 - Vercel에서는 각 요청마다 연결 재사용
let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI 환경 변수가 설정되지 않았습니다');
    return null;
  }
  
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedDb = db;
    console.log('✅ MongoDB 연결 성공');
    return db;
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err.message);
    return null;
  }
}

// 초기 연결 시도 (에러 무시)
connectDB().catch(err => console.warn('초기 DB 연결 실패:', err.message));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// 테스트 라우트 (가장 먼저)
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Community Board API Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: '🚀 Community Board API',
    status: 'running'
  });
});

// 라우트 안전하게 로드
try {
  const authRoutes = require('./routes/auth');
  const postRoutes = require('./routes/posts');
  const commentRoutes = require('./routes/comments');
  const userRoutes = require('./routes/users');
  const uploadRoutes = require('./routes/upload');
  const emailRoutes = require('./routes/email');
  const adminRoutes = require('./routes/admin');
  const messageRoutes = require('./routes/messages');

  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/admin', adminRoutes);
  
  console.log('✅ 모든 라우터 등록 완료');
} catch (error) {
  console.error('❌ 라우트 로딩 실패:', error.message);
}

// OAuth 라우트 (환경 변수가 설정된 경우에만)
if (process.env.GOOGLE_CLIENT_ID || process.env.GITHUB_CLIENT_ID) {
  const jwt = require('jsonwebtoken');
  const passport = require('./config/passport');

  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID) {
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
      (req, res) => {
        const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
      }
    );
  }

  // GitHub OAuth
  if (process.env.GITHUB_CLIENT_ID) {
    app.get('/api/auth/github',
      passport.authenticate('github', { scope: ['user:email'] })
    );

    app.get('/api/auth/github/callback',
      passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
      (req, res) => {
        const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
      }
    );
  }
}

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('❌ 서버 에러:', err.stack);
  res.status(500).json({ 
    error: '서버 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Vercel을 위한 export
module.exports = app;

// 로컬 개발 환경에서만 서버 시작
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
}
 
