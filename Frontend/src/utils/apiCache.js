/**
 * apiCache.js
 *
 * A simple in-memory cache for static/slow-changing API responses.
 * - First call hits the network, result is stored in memory.
 * - Subsequent calls within TTL return the cached value instantly (0ms, 0 server load).
 * - After TTL expires the next call refreshes silently.
 * - Deduplicates in-flight requests: if 3 components call the same key at the same
 *   time, only ONE network request is made and all 3 get the same result.
 *
 * With 1 lakh active users this saves ~100,000 redundant API calls per page load.
 */

const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

const store = {};      // { [key]: { data, expiresAt } }
const inflight = {};   // { [key]: Promise }

/**
 * @param {string} key        - unique cache key (use the URL)
 * @param {() => Promise}  fetcher - async function that returns the data
 * @param {number} ttl        - milliseconds to keep cached (default 10 min)
 */
export const cachedFetch = (key, fetcher, ttl = DEFAULT_TTL) => {
  const now = Date.now();

  // Cache hit — return immediately
  if (store[key] && store[key].expiresAt > now) {
    return Promise.resolve(store[key].data);
  }

  // Deduplicate: if a request for this key is already in-flight, reuse it
  if (inflight[key]) return inflight[key];

  // Cache miss — fetch and store
  inflight[key] = fetcher()
    .then((data) => {
      store[key] = { data, expiresAt: now + ttl };
      delete inflight[key];
      return data;
    })
    .catch((err) => {
      delete inflight[key];
      throw err;
    });

  return inflight[key];
};

/** Call this from admin panel after saving settings to force a refresh on next access */
export const invalidateCache = (key) => {
  delete store[key];
};

/** Invalidate all cached entries */
export const invalidateAll = () => {
  Object.keys(store).forEach((k) => delete store[k]);
};
