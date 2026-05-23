const RATE_LIMIT_STORE_KEY = "__kookid_rate_limit_store__";

/** @type {Map<string, { count: number, windowStart: number }>} */
const store = globalThis[RATE_LIMIT_STORE_KEY] || new Map();
globalThis[RATE_LIMIT_STORE_KEY] = store;

function normalizeIp(ip) {
  if (!ip) return "unknown";
  return String(ip).replace(/^::ffff:/, "").trim() || "unknown";
}

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = String(forwarded).split(",")[0];
    if (first) return normalizeIp(first);
  }

  const realIp = req.headers["x-real-ip"];
  if (realIp) return normalizeIp(realIp);

  return normalizeIp(req.socket?.remoteAddress || "unknown");
}

function cleanupExpired(now, windowMs) {
  // Lightweight opportunistic cleanup to keep memory bounded in warm runtimes.
  for (const [key, value] of store.entries()) {
    if (now - value.windowStart > windowMs * 2) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(req, {
  keyPrefix = "global",
  limit = 60,
  windowMs = 60 * 1000,
} = {}) {
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${keyPrefix}:${ip}`;

  const current = store.get(key);
  if (!current || now - current.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    cleanupExpired(now, windowMs);
    return {
      allowed: true,
      ip,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (current.count >= limit) {
    const retryAfterMs = Math.max(0, windowMs - (now - current.windowStart));
    return {
      allowed: false,
      ip,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    allowed: true,
    ip,
    limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: Math.ceil(windowMs / 1000),
  };
}

export function enforceRateLimit(req, res, options) {
  const result = checkRateLimit(req, options);

  res.setHeader("X-RateLimit-Limit", String(result.limit));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));

  if (!result.allowed) {
    res.setHeader("Retry-After", String(result.retryAfterSeconds));
    res.status(429).json({
      error: "Too many requests",
      retryAfterSeconds: result.retryAfterSeconds,
    });
    return false;
  }

  return true;
}
