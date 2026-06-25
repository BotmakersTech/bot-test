import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8081/api",
  withCredentials: true,
});

// ================= AUTO-REFRESH ON 401 =================
// When the 15-min access token expires any API call returns 401.
// The interceptor refreshes the token transparently and retries.
// Pending 401s during a refresh are queued and flushed on success,
// or rejected on failure — they never hang.

interface PendingRequest {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}

let isRefreshing = false;
let pendingRequests: PendingRequest[] = [];

function flushPending(token: string) {
  const queue = pendingRequests;
  pendingRequests = [];
  isRefreshing = false;
  queue.forEach(({ resolve }) => resolve(token));
}

function rejectPending(err: unknown) {
  const queue = pendingRequests;
  pendingRequests = [];
  isRefreshing = false;
  queue.forEach(({ reject }) => reject(err));
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const res = await api.post("/auth/refresh");
        const { accessToken } = res.data;

        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        // Reset state and flush queue BEFORE retrying the original — this way
        // any new 401 that arrives during the flush starts a fresh refresh cycle
        // instead of queuing onto an already-cleared array.
        flushPending(accessToken);

        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        rejectPending(refreshError);
        delete api.defaults.headers.common["Authorization"];
        // Dispatch a custom event so the React app can navigate gracefully
        // instead of a hard reload that destroys all in-memory state.
        window.dispatchEvent(new CustomEvent("session-expired"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
