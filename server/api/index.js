// Vercel Serverless Function Entry Point
try {
  const app = require('../server');
  console.log('✅ Serverless function initialized successfully');
  module.exports = app;
} catch (error) {
  console.error('❌ 서버 초기화 실패:', error);
  console.error('Stack trace:', error.stack);
  
  // 기본 Express 앱 생성 (fallback)
  const express = require('express');
  const app = express();
  const cors = require('cors');
  
  app.use(cors());
  app.use(express.json());
  
  // 헬스체크 엔드포인트
  app.get('/', (req, res) => {
    res.status(500).json({ 
      error: 'Server Initialization Failed',
      message: 'The server failed to start properly',
      details: error.message,
      troubleshooting: [
        '1. Check Vercel Deployment Logs',
        '2. Verify Environment Variables in Vercel Dashboard',
        '3. Required: MONGODB_URI, JWT_SECRET, CLIENT_URL',
        '4. Check package.json dependencies'
      ]
    });
  });
  
  // 모든 경로에 대한 에러 응답
  app.use('*', (req, res) => {
    res.status(503).json({ 
      error: 'Service Unavailable',
      message: 'Server initialization failed',
      initError: error.message,
      path: req.path,
      hint: 'Check Vercel Function logs for details'
    });
  });
  
  module.exports = app;
}
