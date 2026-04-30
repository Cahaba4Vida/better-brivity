const API_BASE = '/api';

export function getStoredKeys() {
  return {
    adminKey: localStorage.getItem('reai_admin_key') || '',
    setupSecret: localStorage.getItem('reai_setup_secret') || '',
  };
}

export function saveKeys({ adminKey, setupSecret }) {
  if (adminKey !== undefined) localStorage.setItem('reai_admin_key', adminKey);
  if (setupSecret !== undefined) localStorage.setItem('reai_setup_secret', setupSecret);
}

export async function api(path, options = {}) {
  const { adminKey, setupSecret } = getStoredKeys();
  const headers = {
    'content-type': 'application/json',
    ...(adminKey ? { 'x-admin-api-key': adminKey } : {}),
    ...(setupSecret && path === '/setup-db' ? { 'x-setup-secret': setupSecret } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.error || `${response.status} ${response.statusText}`);
  }
  return data;
}
