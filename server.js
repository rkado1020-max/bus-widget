// 버스 위젯용 로컬 서버: 화면을 보여주고, 공공데이터포털 API 호출을 대신 전달해요.
// 실행: node server.js  (인증키는 config.json 또는 환경변수 BUS_API_KEY)
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3939;
const BASE = 'https://apis.data.go.kr/6410000/';

function loadKey() {
  if (process.env.BUS_API_KEY) return process.env.BUS_API_KEY;
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')).serviceKey || '';
  } catch { return ''; }
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname.startsWith('/api/')) {
    const key = String(req.headers['x-bus-key'] || '').trim() || loadKey();   // 사용자 키 우선, 없으면 config.json
    if (!key) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'NO_KEY' }));
    }
    if (!/^[A-Za-z0-9%+/=_-]{10,200}$/.test(key)) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'BAD_KEY' }));
    }
    const enc = key.includes('%') ? key : encodeURIComponent(key);
    const target = BASE + url.pathname.slice(5) + '?serviceKey=' + enc +
      '&format=json&' + url.searchParams.toString();
    https.get(target, up => {
      res.writeHead(up.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      up.pipe(res);
    }).on('error', e => {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: String(e) }));
    });
    return;
  }

  fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
    if (err) { res.writeHead(500); return res.end('index.html 없음'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log('버스 위젯: http://localhost:' + PORT));
