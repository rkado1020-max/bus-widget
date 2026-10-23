// Vercel 서버리스 함수: 공공데이터포털 API 호출을 대신 전달해요. 인증키는 각 사용자가 보낸 헤더(x-bus-key)만 쓰고, 서버에 저장하지 않아요.
const BASE = 'https://apis.data.go.kr/6410000/';

module.exports = async (req, res) => {
  const key = String(req.headers['x-bus-key'] || '').trim();
  if (!key) return res.status(200).json({ error: 'NO_KEY' });
  if (!/^[A-Za-z0-9%+/=_-]{10,200}$/.test(key)) return res.status(200).json({ error: 'BAD_KEY' });
  const { path, ...rest } = req.query;
  const sub = [].concat(path || []).join('/');
  if (!/^[A-Za-z0-9/]+$/.test(sub)) return res.status(400).json({ error: 'BAD_PATH' });
  const params = new URLSearchParams(rest);
  const enc = key.includes('%') ? key : encodeURIComponent(key);
  try {
    const r = await fetch(BASE + sub + '?serviceKey=' + enc + '&format=json&' + params.toString());
    res.setHeader('Cache-Control', 'private, max-age=15');   // 키별 응답이라 공유 캐시에는 올리지 않아요
    res.setHeader('Vary', 'x-bus-key');
    res.status(r.status).setHeader('Content-Type', 'application/json; charset=utf-8').send(await r.text());
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
