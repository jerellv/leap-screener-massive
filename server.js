const https = require('https');

function httpsGet(reqUrl) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(reqUrl);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers:  { 'Accept': 'application/json' }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Massive request timeout')); });
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });

  const MASSIVE_KEY = (process.env.MASSIVE_API_KEY || '').trim();
  if (!MASSIVE_KEY) {
    return res.status(503).json({ error: 'MASSIVE_API_KEY not configured in Vercel environment variables' });
  }

  // req.url is the full original request path, e.g. /api/massive/v2/aggs/ticker/MSFT/...
  // Strip the /api/massive/ prefix to get the actual Massive subpath
  const rawUrl  = req.url || '/';
  const prefix  = '/api/massive/';
  const subPath = rawUrl.startsWith(prefix) ? rawUrl.slice(prefix.length) : rawUrl.slice(1);
  const sep     = subPath.includes('?') ? '&' : '?';
  const target  = `https://api.massive.com/${subPath}${sep}apiKey=${MASSIVE_KEY}`;

  console.log(`[MASSIVE] ${subPath}`);

  try {
    const r = await httpsGet(target);
    res.status(r.status).setHeader('Content-Type', 'application/json').end(r.body);
  } catch (e) {
    console.error('[MASSIVE PROXY ERROR]', e.message);
    res.status(502).json({ error: e.message });
  }
};
