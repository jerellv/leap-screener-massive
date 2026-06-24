module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json({
    massive: !!(process.env.MASSIVE_API_KEY || '').trim(),
    server:  'leap-screener-massive',
    version: '1.0'
  });
};
