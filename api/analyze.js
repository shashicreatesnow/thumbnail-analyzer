export default async function handler(req, res) {
  // CORS — restrict to your app's domain
  const allowedOrigins = [
    'https://thumbnail-analyzer.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
  }

  try {
    const { prompt, imageBase64 } = req.body;

    if (!prompt || !imageBase64) {
      return res.status(400).json({ error: 'Missing prompt or imageBase64' });
    }

    const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
    const MODEL = 'gemini-2.5-flash';
    const url = `${API_BASE}/${MODEL}:generateContent?key=${API_KEY}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      return res.status(response.status).json({ error: data.error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
