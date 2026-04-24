import axios from "axios";

/* ─────────────────────────────────────────────
   1. Global timeout — 20 s
   Without this, every request hangs "pending" forever
   when the backend server is sleeping / slow to wake.
───────────────────────────────────────────── */
axios.defaults.timeout = 20000;

/* ─────────────────────────────────────────────
   2. Retry once on timeout or network error
   Free-tier servers (Render, Railway) sleep after ~15 min.
   The FIRST request wakes the server but times out.
   The SECOND request (auto-retry after 2 s) almost always succeeds.
───────────────────────────────────────────── */
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    const isNetworkOrTimeout =
      !error.response || error.code === "ECONNABORTED";

    if (isNetworkOrTimeout && config && !config._retryCount) {
      config._retryCount = (config._retryCount || 0) + 1;

      if (config._retryCount <= MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return axios(config);
      }
    }

    return Promise.reject(error);
  }
);
