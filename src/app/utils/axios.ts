/* Minimal API utility — uses fetch under the hood, provides an axios-like interface */

import { toast } from "react-toastify";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const STORAGE_KEY_TOKEN = "lmp_access_token";
const STORAGE_KEY_USER  = "lmp_user";

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
    // ── Token expired / unauthorised ──────────────────────────────────────
    if (resp.status === 401) {
      const msg =
        data?.message ||
        data?.detail ||
        "Session expired. Please log in again.";

      toast.error(msg);

      // Clear auth storage (mirrors AuthContext.logout)
      try {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
      } catch {
        // ignore
      }

      // Hard-redirect to login (module-level — no React router available here)
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    const err: any = new Error(
      data?.message || `Request failed with status ${resp.status}`,
    );
    err.response = { data, status: resp.status };
    throw err;
  }

  return { data, status: resp.status, headers: resp.headers };
}

const api = {
  get: <T = any>(
    url: string,
    config?: {
      headers?: Record<string, string>;
      params?: Record<string, string | number | boolean>;
    },
  ) => request<T>("GET", url, config),

  post: <T = any>(
    url: string,
    data?: unknown,
    config?: { headers?: Record<string, string> },
  ) => request<T>("POST", url, { ...config, data }),

  put: <T = any>(
    url: string,
    data?: unknown,
    config?: { headers?: Record<string, string> },
  ) => request<T>("PUT", url, { ...config, data }),

  patch: <T = any>(
    url: string,
    data?: unknown,
    config?: { headers?: Record<string, string> },
  ) => request<T>("PATCH", url, { ...config, data }),

  delete: <T = any>(
    url: string,
    config?: {
      headers?: Record<string, string>;
      params?: Record<string, string | number | boolean>;
    },
  ) => request<T>("DELETE", url, config),
};

export default api;
