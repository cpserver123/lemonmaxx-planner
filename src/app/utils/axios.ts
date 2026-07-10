/* Minimal API utility — uses fetch under the hood, provides an axios-like interface */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

async function request<T = any>(
  method: string,
  url: string,
  options: {
    headers?: Record<string, string>;
    data?: unknown;
    params?: Record<string, string | number | boolean>;
  } = {},
): Promise<ApiResponse<T>> {
  let fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;

  // Append query params
  if (options.params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(options.params)) {
      qs.set(k, String(v));
    }
    fullUrl += (fullUrl.includes("?") ? "&" : "?") + qs.toString();
  }

  const resp = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(options.headers || {}),
    },
    body: options.data ? JSON.stringify(options.data) : undefined,
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const err: any = new Error(data?.message || `Request failed with status ${resp.status}`);
    err.response = { data, status: resp.status };
    throw err;
  }

  return { data, status: resp.status, headers: resp.headers };
}

const api = {
  get: <T = any>(url: string, config?: { headers?: Record<string, string>; params?: Record<string, string | number | boolean> }) =>
    request<T>("GET", url, config),

  post: <T = any>(url: string, data?: unknown, config?: { headers?: Record<string, string> }) =>
    request<T>("POST", url, { ...config, data }),

  put: <T = any>(url: string, data?: unknown, config?: { headers?: Record<string, string> }) =>
    request<T>("PUT", url, { ...config, data }),

  patch: <T = any>(url: string, data?: unknown, config?: { headers?: Record<string, string> }) =>
    request<T>("PATCH", url, { ...config, data }),

  delete: <T = any>(url: string, config?: { headers?: Record<string, string> }) =>
    request<T>("DELETE", url, config),
};

export default api;
