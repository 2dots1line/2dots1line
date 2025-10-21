import { useEffect, useMemo, useState } from 'react';

export interface GeneratedCoverPayload {
  motif: string;
  style_pack?: string;
  constraints?: string[];
  palette?: Record<string, string>;
  export?: {
    size?: number;
    background?: 'transparent' | 'white' | 'black';
    quality?: 'low' | 'medium' | 'high';
  };
}

interface UseGeneratedCoverOptions {
  enabled?: boolean;
  cacheKey?: string;
  payload: GeneratedCoverPayload;
}

interface UseGeneratedCoverResult {
  image: string | null;
  loading: boolean;
  error: string | null;
}

export function useGeneratedCover(options: UseGeneratedCoverOptions): UseGeneratedCoverResult {
  const { enabled = true, cacheKey, payload } = options;
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const localKey = useMemo(() => cacheKey ? `card-cover:${cacheKey}` : undefined, [cacheKey]);

  // New: allow overriding the disable flag via URL param ?covergen=1
  const forceAttempt = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const usp = new URLSearchParams(window.location.search);
    return usp.get('covergen') === '1';
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Manual-only gate: do not run unless explicitly enabled by a user gesture
    if (typeof window !== 'undefined') {
      const gated = (window as any).__COVER_MANUAL === true;
      if (!gated) {
        return;
      }
    }

    // Respect the disable flag unless forceAttempt=true
    const disabled = typeof window !== 'undefined' && localStorage.getItem('card-cover:disabled') === '1';
    if (disabled && !forceAttempt) {
      return;
    }
    if (forceAttempt && typeof window !== 'undefined') {
      localStorage.removeItem('card-cover:disabled');
      localStorage.removeItem('card-cover:preflight');
    }

    let cancelled = false;

    // Deduplicate in-flight POST for this localKey (prevents double-fire under StrictMode)
    function getPostSlot(): { has: boolean; set(p: Promise<any>): void; get(): Promise<any> | undefined; clear(): void } {
      if (typeof window === 'undefined' || !localKey) {
        return { has: false, set() {}, get() { return undefined; }, clear() {} };
      }
      const w = window as any;
      w.__coverPostInFlight = w.__coverPostInFlight || {};
      return {
        get() { return w.__coverPostInFlight[localKey]; },
        set(p: Promise<any>) { w.__coverPostInFlight[localKey] = p; },
        has: !!w.__coverPostInFlight[localKey],
        clear() {
          try { delete w.__coverPostInFlight[localKey]; } catch (err) { void err; }
        },
      };
    }

    // New: single global preflight to avoid POST spam when key is missing
    async function preflight(): Promise<boolean> {
      if (typeof window === 'undefined') return true;

      const cached = localStorage.getItem('card-cover:preflight');
      if (cached === 'ok') return true;
      if (cached === 'fail') return true; // allow manual attempts even if last preflight failed

      const w = (window as any);
      if (w.__coverPreflight) {
        try {
          return await w.__coverPreflight;
        } catch {
          return true;
        }
      }

      w.__coverPreflight = fetch('/api/covers/generate', { method: 'GET' })
        .then(async (res: Response) => {
          if (!res.ok) {
            localStorage.setItem('card-cover:preflight', 'fail');
            return true; // do not block attempts
          }
          localStorage.setItem('card-cover:preflight', 'ok');
          return true;
        })
        .catch(() => {
          localStorage.setItem('card-cover:preflight', 'fail');
          return true; // do not block attempts
        })
        .finally(() => {
          setTimeout(() => {
            try { delete (window as any).__coverPreflight; } catch (err) { void err; }
          }, 0);
        });

      return await w.__coverPreflight;
    }

    async function run() {
      try {
        setLoading(true);
        setError(null);

        // Preflight first — now permissive, never disables, never blocks
        await preflight();

        if (localKey) {
          const cached = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
          if (cached) {
            setImage(cached);
            setLoading(false);
            return;
          }
        }

        const slot = getPostSlot();
        const existing = slot.get();
        if (existing) {
          // If a request is already running for this card, wait for it
          const data = await existing;
          if (!cancelled && data?.image) {
            setImage(data.image);
            if (localKey) localStorage.setItem(localKey, data.image);
          }
          return;
        }

        // Helper: delay
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        // Helper: compute retry delay from response/body or exponential backoff
        function computeRetryDelayMs(status: number, bodyText: string | null, attempt: number): number {
          // If server gave Retry-After header, fetch() exposes it via res.headers — handled below (we pass it in)
          // If body contains Gemini retryDelay like "retryDelay":"29s", prefer that
          if (bodyText) {
            try {
              const j = JSON.parse(bodyText);
              const details = j?.error?.details || [];
              const retry = details.find((d: any) => d?.['@type']?.includes('RetryInfo'));
              const retryDelay = retry?.retryDelay as string | undefined;
              if (retryDelay) {
                const m = retryDelay.match(/(\d+)\s*s/);
                if (m) {
                  const secs = Math.max(1, parseInt(m[1], 10));
                  // jitter 0-2000ms
                  return secs * 1000 + Math.floor(Math.random() * 2000);
                }
              }
            } catch {
              // ignore json parse error
            }
          }
          // Fallback exponential backoff with jitter, cap at 30s
          const base = Math.min(30000, 1000 * Math.pow(2, attempt - 1));
          const jitter = Math.floor(Math.random() * 1500);
          return base + jitter;
        }

        async function generateWithRetry(maxAttempts = 5): Promise<any> {
          let attempt = 1;
          let lastError = 'Unknown error';
          while (attempt <= maxAttempts) {
            // Small initial jitter to avoid thundering herd across multiple cards
            if (attempt === 1) {
              await sleep(Math.floor(Math.random() * 800));
            }
            try {
              const res = await fetch('/api/covers/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

              if (!res.ok) {
                const status = res.status;
                const bodyText = await res.text().catch(() => null);
                lastError = `HTTP ${status}: ${bodyText ?? ''}`;

                // Do not disable on 429; we will retry after delay
                const nonRetryable = [401, 402, 403, 404]; // auth/forbidden/not-found — don't hammer
                if (nonRetryable.includes(status)) {
                  throw new Error(lastError);
                }

                // Compute delay (prefer Retry-After header if present)
                let delayMs: number | undefined;
                const retryAfter = res.headers.get('Retry-After');
                if (retryAfter) {
                  const secs = Math.max(1, parseInt(retryAfter, 10));
                  delayMs = secs * 1000 + Math.floor(Math.random() * 2000);
                }
                if (!delayMs) {
                  delayMs = computeRetryDelayMs(status, bodyText, attempt);
                }

                if (attempt >= maxAttempts) {
                  throw new Error(lastError);
                }
                await sleep(delayMs);
                attempt += 1;
                continue;
              }

              // Success
              return await res.json();
            } catch (e: any) {
              lastError = e?.message || String(e);
              if (attempt >= maxAttempts) {
                throw new Error(lastError);
              }
              // Network/unknown error: backoff
              const delayMs = computeRetryDelayMs(0, null, attempt);
              await sleep(delayMs);
              attempt += 1;
            }
          }
          throw new Error(lastError);
        }

        const p = generateWithRetry(5)
          .finally(() => slot.clear());

        if (slot && !existing) slot.set(p);

        const data = await p;
        const url: string | undefined = data?.image;

        if (!cancelled) {
          if (url) {
            setImage(url);
            if (localKey) localStorage.setItem(localKey, url);
          } else {
            // Keep trying later if needed, but surface error
            setError('No image returned');
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to generate cover');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [enabled, localKey, payload, forceAttempt]);

  return { image, loading, error };
}