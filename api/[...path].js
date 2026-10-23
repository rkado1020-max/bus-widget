// Vercel 서버리스 함수: 공공데이터포털 API 호출을 대신 전달해요. 인증키는 환경변수 BUS_API_KEY에 넣어요.
const BASE = 'https://apis.data.go.kr/6410000/';

module.exports = async (req, res) => {
  const key = process.env.BUS_API_KEY || '';
  if (!key) return res.status(200).json({ error: 'NO_KEY' });
  const { path, ...rest } = req.query;
  const sub = [].concat(path || []).join('/');
  if (!/^[A-Za-z0-9/]+$/.test(sub)) return res.status(400).json({ error: 'BAD_PATH' });
  const params = new URLSearchParams(rest);
  const enc = key.includes('%') ? key : encodeURIComponent(key);
  try {
    const r = await fetch(BASE + sub + '?serviceKey=' + enc + '&format=json&' + params.toString());
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');   // 같은 요청이 몰려도 API 호출을 아껴요
    res.status(r.status).setHeader('Content-Type', 'application/json; charset=utf-8').send(await r.text());
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
