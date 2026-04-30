# Ollama Worker

Netlify Functions should not expose your Ollama process directly. Run this small proxy near your Ollama instance.

## Local

```bash
npm install
OLLAMA_HOST=http://127.0.0.1:11434 WORKER_API_KEY=change-me npm start
```

Then set the Netlify app env vars:

```txt
OLLAMA_API_URL=https://your-worker.example.com/generate
OLLAMA_API_KEY=change-me
OLLAMA_MODEL=llama3.1:8b
```

## Docker

```bash
docker build -t reai-ollama-worker .
docker run -p 8787:8787 \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  -e WORKER_API_KEY=change-me \
  reai-ollama-worker
```
