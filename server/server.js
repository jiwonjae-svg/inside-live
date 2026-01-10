// 환경 변수 로드 및 환경 감지
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const isProduction = process.env.NODE_ENV === 'production';

if (!isVercel) {
  const dotenv = require('dotenv');
  dotenv.config();
  console.log('📝 .env 파일 로드됨');
}

console.log('🔧 환경:', isVercel ? 'Vercel' : '로컬', isProduction ? '프로덕션' : '개발');
console.log('🔧 MONGODB_URI:', process.env.MONGODB_URI ? '✅ 설정됨' : '❌ 없음');
console.log('🔧 JWT_SECRET:', process.env.JWT_SECRET ? '✅ 설정됨' : '❌ 없음');

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
const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
if (!process.env.SESSION_SECRET && !process.env.JWT_SECRET) {
  console.warn('⚠️ SESSION_SECRET와 JWT_SECRET이 설정되지 않음. 기본값 사용 중.');
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    sameSite: isProduction ? 'none' : 'lax'
  }
}));

// Passport 초기화 (OAuth 사용 시에만)
if (process.env.GOOGLE_CLIENT_ID || process.env.GITHUB_CLIENT_ID) {
  const passport = require('./config/passport');
  app.use(passport.initialize());
  app.use(passport.session());
}

// Rate Limiting (API 경로에 맞게 수정)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: isProduction ? 100 : 1000, // 프로덕션: 100, 개발: 1000
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
});
// Vercel에서는 /api prefix가 없으므로 / 경로에 적용
app.use(limiter);

// MongoDB 연결 - Vercel에서는 각 요청마다 연결 재사용
let cachedDb = null;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI 환경 변수가 설정되지 않았습니다');
    if (isProduction) {
      throw new Error('MONGODB_URI is required in production');
    }
    return null;
  }
  
  try {
    connectionAttempts++;
    console.log(`🔄 MongoDB 연결 시도 (${connectionAttempts}/${MAX_RETRY_ATTEMPTS})...`);
    
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedDb = db;
    connectionAttempts = 0; // 성공 시 리셋
    console.log('✅ MongoDB 연결 성공');
    return db;
  } catch (err) {
    console.error(`❌ MongoDB 연결 실패 (시도 ${connectionAttempts}):`, err.message);
    
    if (connectionAttempts < MAX_RETRY_ATTEMPTS && !isProduction) {
      console.log('🔄 재연결 시도 중...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return connectDB();
    }
    
    if (isProduction) {
      throw err;
    }
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

// 환경 변수 검증
const missingEnvVars = [];
if (!process.env.MONGODB_URI) missingEnvVars.push('MONGODB_URI');
if (!process.env.JWT_SECRET) missingEnvVars.push('JWT_SECRET');
if (!process.env.CLIENT_URL) missingEnvVars.push('CLIENT_URL');

if (missingEnvVars.length > 0 && isProduction) {
  console.error(`❌ 필수 환경 변수 누락: ${missingEnvVars.join(', ')}`);
  console.error('⚠️ Vercel Dashboard → Settings → Environment Variables에서 설정하세요');
  console.error('⚠️ 설정 후 Redeploy 필요');
}

// 라우트 안전하게 로드
let routesLoaded = false;
try {
  const authRoutes = require('./routes/auth');
  const postRoutes = require('./routes/posts');
  const commentRoutes = require('./routes/comments');
  const userRoutes = require('./routes/users');
  const uploadRoutes = require('./routes/upload');
  const emailRoutes = require('./routes/email');
  const adminRoutes = require('./routes/admin');
  const messageRoutes = require('./routes/messages');

  // 환경에 따라 API prefix 조정
  // Vercel: /api prefix 없음 (vercel.json에서 /api로 라우팅)
  // 로컬: /api prefix 사용
  const apiPrefix = isVercel ? '' : '/api';
  
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/posts`, postRoutes);
  app.use(`${apiPrefix}/comments`, commentRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/upload`, uploadRoutes);
  app.use(`${apiPrefix}/email`, emailRoutes);
  app.use(`${apiPrefix}/messages`, messageRoutes);
  app.use(`${apiPrefix}/admin`, adminRoutes);
  
  routesLoaded = true;
  console.log(`✅ 모든 라우터 등록 완료 (prefix: "${apiPrefix || '/'}")`);
  console.log(`   - ${apiPrefix || '/'}/auth`);
  console.log(`   - ${apiPrefix || '/'}/posts`);
  console.log(`   - ${apiPrefix || '/'}/comments`);
  console.log(`   - ${apiPrefix || '/'}/users`);
  console.log(`   - ${apiPrefix || '/'}/upload`);
  console.log(`   - ${apiPrefix || '/'}/email`);
  console.log(`   - ${apiPrefix || '/'}/messages`);
  console.log(`   - ${apiPrefix || '/'}/admin`);
} catch (error) {
  console.error('❌ 라우트 로딩 실패:', error.message);
  console.error(error.stack);
  
  if (isProduction) {
    console.error('⚠️ 가능한 원인:');
    console.error('   1. MongoDB 연결 실패 → MONGODB_URI 환경 변수 확인');
    console.error('   2. 모델 로딩 실패 → 의존성 패키지 확인');
    console.error('   3. 미들웨어 초기화 실패 → JWT_SECRET 환경 변수 확인');
  }
}

// OAuth 라우트 (환경 변수가 설정된 경우에만)
if (process.env.GOOGLE_CLIENT_ID || process.env.GITHUB_CLIENT_ID) {
  try {
    const jwt = require('jsonwebtoken');
    const passport = require('./config/passport');
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ JWT_SECRET이 설정되지 않음. OAuth 토큰 생성 불가능.');
    }

    const apiPrefix = isVercel ? '' : '/api';

    // Google OAuth
    if (process.env.GOOGLE_CLIENT_ID) {
      app.get(`${apiPrefix}/auth/google`,
        passport.authenticate('google', { scope: ['profile', 'email'] })
      );

      app.get(`${apiPrefix}/auth/google/callback`,
        passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login` }),
        (req, res) => {
          if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'JWT_SECRET not configured' });
          }
          const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
          const refreshToken = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
          res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
        }
      );
      console.log('✅ Google OAuth 라우트 등록됨');
    }

    // GitHub OAuth
    if (process.env.GITHUB_CLIENT_ID) {
      app.get(`${apiPrefix}/auth/github`,
        passport.authenticate('github', { scope: ['user:email'] })
      );

      app.get(`${apiPrefix}/auth/github/callback`,
        passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login` }),
        (req, res) => {
          if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'JWT_SECRET not configured' });
          }
          const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
          const refreshToken = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
          res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
        }
      );
      console.log('✅ GitHub OAuth 라우트 등록됨');
    }
  } catch (error) {
    console.error('❌ OAuth 라우트 설정 실패:', error.message);
  }
} else {
  console.log('ℹ️ OAuth 환경 변수 미설정 - OAuth 비활성화됨');
}

// 404 핸들러 (모든 라우트 이후)
app.use((req, res, next) => {
  console.log(`⚠️ 404 Not Found: ${req.method} ${req.path}`);
  
  const response = { 
    error: 'Not Found',
    message: `경로를 찾을 수 없습니다: ${req.path}`,
    method: req.method,
    path: req.path
  };
  
  // 라우트가 로딩되지 않았거나 환경 변수가 누락된 경우 추가 정보 제공
  if (!routesLoaded && isProduction) {
    response.hint = '라우트가 로딩되지 않았습니다. 환경 변수를 확인하세요.';
    response.missingEnvVars = missingEnvVars;
    response.troubleshooting = [
      '1. Vercel Dashboard → Settings → Environment Variables',
      '2. 최소 필수 변수: MONGODB_URI, JWT_SECRET, CLIENT_URL',
      '3. 설정 후 Deployments → Redeploy 클릭'
    ];
  }
  
  res.status(404).json(response);
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('❌ 서버 에러:', {
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({ 
    error: isProduction ? '서버 오류가 발생했습니다.' : err.message,
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    path: req.path
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
 
