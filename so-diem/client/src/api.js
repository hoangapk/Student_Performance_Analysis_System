const BASE = import.meta.env.VITE_API_URL || '';

export const tokenStore = {
  get() {
    try {
      return sessionStorage.getItem('token');
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');
    } catch {
      /* bỏ qua nếu trình duyệt chặn storage */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
    } catch {
      /* bỏ qua */
    }
  },
};

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra. Thử lại sau.');
  return data;
}