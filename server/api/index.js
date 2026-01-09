// Vercel Serverless Function Entry Point
try {
  const app = require('../server');
  module.exports = app;
} catch (error) {
  console.error('❌ 서버 초기화 실패:', error);
  
  // 기본 Express 앱 생성 (fallback)
  const express = require('express');
  const app = express();
  
  app.get('*', (req, res) => {
    res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message 
    });
  });
  
  module.exports = app;
}
