import express from 'express';

const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.PORT || 8787);
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const WORKER_API_KEY = process.env.WORKER_API_KEY || '';

function requireAuth(req, res, next) {
  if (!WORKER_API_KEY) return next();
  const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (supplied !== WORKER_API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/health', (_, res) => {
  res.json({ ok: true, ollamaHost: OLLAMA_HOST });
});

app.post('/generate', requireAuth, async (req, res) => {
  const body = {
    model: req.body.model || process.env.OLLAMA_MODEL || 'llama3.1:8b',
    prompt: req.body.prompt,
    format: req.body.format || 'json',
    stream: false,
    options: req.body.options || { temperature: 0.2 },
  };

  if (!body.prompt) return res.status(400).json({ error: 'prompt is required' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.OLLAMA_TIMEOUT_MS || 60000));
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    res.status(response.status).type('application/json').send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, () => {
  console.log(`Ollama worker listening on :${PORT}, proxying ${OLLAMA_HOST}`);
});
