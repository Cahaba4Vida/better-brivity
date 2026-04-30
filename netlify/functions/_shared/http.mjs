export function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

export function noContent() {
  return { statusCode: 204, body: '' };
}

export function parseJsonBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch (error) {
    const err = new Error('Invalid JSON body');
    err.statusCode = 400;
    throw err;
  }
}

export function getHeader(event, name) {
  const target = name.toLowerCase();
  const headers = event.headers || {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const err = new Error(`Missing required environment variable: ${name}`);
    err.statusCode = 500;
    throw err;
  }
  return value;
}

export function getTeamId() {
  return process.env.DEFAULT_TEAM_ID || '00000000-0000-0000-0000-000000000001';
}

export function assertAdmin(event) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured) return;
  const supplied = getHeader(event, 'x-admin-api-key') || getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '');
  if (supplied !== configured) {
    const err = new Error('Unauthorized: missing or invalid x-admin-api-key');
    err.statusCode = 401;
    throw err;
  }
}

export function assertSetupSecret(event) {
  const configured = process.env.SETUP_SECRET;
  if (!configured) {
    const err = new Error('Missing SETUP_SECRET environment variable');
    err.statusCode = 500;
    throw err;
  }
  const supplied = getHeader(event, 'x-setup-secret');
  if (supplied !== configured) {
    const err = new Error('Unauthorized: missing or invalid x-setup-secret');
    err.statusCode = 401;
    throw err;
  }
}

export function getPagination(event, defaults = { limit: 50, max: 200 }) {
  const params = event.queryStringParameters || {};
  const limit = Math.min(Number(params.limit || defaults.limit), defaults.max);
  const offset = Math.max(Number(params.offset || 0), 0);
  return { limit, offset };
}

export function handleError(error) {
  console.error(error);
  const statusCode = error?.statusCode || 500;
  return json(statusCode, {
    error: error?.message || 'Internal server error',
  });
}

export function okStatus(value) {
  return value ? 'configured' : 'missing';
}

export function nowIso() {
  return new Date().toISOString();
}
