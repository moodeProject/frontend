// Share concurrent reads and back off after failures without clearing UI errors.
export function createRequestGate({ load, onStart, onSuccess, onError, onFinish, now = Date.now }) {
  let pending = null;
  let retryAt = 0;
  let failures = 0;
  let lastError = null;
  let cached;
  return {
    run(params = {}, { force = false } = {}) {
      if (pending) return pending;
      if (!force && now() < retryAt) return lastError ? Promise.reject(lastError) : Promise.resolve(cached);
      onStart?.();
      pending = Promise.resolve().then(() => load(params)).then(result => {
        cached = result;
        lastError = null;
        failures = 0;
        retryAt = now() + 1000;
        onSuccess?.(result);
        return result;
      }).catch(error => {
        lastError = error;
        failures += 1;
        retryAt = now() + Math.min(30000, 5000 * 2 ** Math.min(failures - 1, 3));
        onError?.(error);
        throw error;
      }).finally(() => {
        pending = null;
        onFinish?.();
      });
      return pending;
    },
  };
}
