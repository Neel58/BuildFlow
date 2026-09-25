const ACCESS_TOKEN_KEY = 'buildflow_access_token';
const REFRESH_TOKEN_KEY = 'buildflow_refresh_token';
const USER_KEY = 'buildflow_user';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getStoredUser = () => {
  const storedUser = localStorage.getItem(USER_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
};

export const setSession = (session) => {
  const { accessToken, refreshToken } = session;
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (session._id) localStorage.setItem(USER_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const accessToken = getAccessToken();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Request failed');
  }

  return payload;
}

export async function login(credentials) {
  const session = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  setSession(session);
  return session;
}

export async function register(details) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(details)
  });
}

export async function logout() {
  clearSession();
}
