type RetryableFetchOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
};

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const sleep = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RetryableFetchOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 15000,
    retries = 2,
    retryDelayMs = 700,
    signal,
    ...rest
  } = init;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    const abortListener = () => controller.abort();
    signal?.addEventListener('abort', abortListener);

    try {
      const response = await fetch(input, {
        ...rest,
        signal: controller.signal,
      });

      if (!RETRYABLE_STATUSES.has(response.status) || attempt === retries) {
        return response;
      }

      await sleep(retryDelayMs * (attempt + 1));
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw error;
      }
      await sleep(retryDelayMs * (attempt + 1));
    } finally {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortListener);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed');
}
