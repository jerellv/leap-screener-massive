const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env manually (no dependencies)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^=#]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

const MASSIVE_KEY = (process.env.MASSIVE_API_KEY || '').trim();
const PORT = 3000;

function httpsGet(reqUrl) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(reqUrl);
    const options = { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'GET', headers: { 'Accept': 'application/json' } };
    const r = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    r.on('error', reject);
    r.setTimeout(15000, () => { r.destroy(); reject(new Error('Massive request timeout')); });
    r.end();
  });
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ massive: !!MASSIVE_KEY, server: 'local', version: '1.0' }));
  }

  if (url.pathname.startsWith('/api/massive/')) {
    if (!MASSIVE_KEY) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'MASSIVE_API_KEY not configured in .env' }));
    }
    const subPath = url.pathname.replace('/api/massive/', '') + (url.search || '');
    const sep = subPath.includes('?') ? '&' : '?';
    const target = `https://api.massive.com/${subPath}${sep}apiKey=${MASSIVE_KEY}`;
    console.log(`[MASSIVE] ${subPath}`);
    try {
      const r = await httpsGet(target);
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      return res.end(r.body);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // Static file serving from /public
  let filePath = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
