let cachedToken = null;
let expiresAt = 0;
let inflightPromise = null;

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const FETCH_TIMEOUT_MS = 5000;

const fetchWithTimeout = (url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
};

export const getCsrfToken = async (apiUrl, authToken, { ttlMs = DEFAULT_TTL_MS } = {}) => {
  const now = Date.now();
  if (cachedToken && now < expiresAt) {
    return cachedToken;
  }
  if (inflightPromise) {
    return inflightPromise;
  }
  inflightPromise = (async () => {
    const res = await fetchWithTimeout(`${apiUrl}/auth/csrf`, {
      method: 'GET',
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : '',
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`CSRF ${res.status}`);
    }
    const data = await res.json();
    const token = data?.token || null;
    cachedToken = token;
    expiresAt = Date.now() + Math.max(1000, ttlMs - 1000); // small skew
    return token;
  })();
  try {
    const token = await inflightPromise;
    return token;
  } finally {
    inflightPromise = null;
  }
};

export const getCsrfTokenSafe = async (apiUrl, authToken, opts) => {
  try {
    return await getCsrfToken(apiUrl, authToken, opts);
  } catch (e) {
    return null;
  }
}; 