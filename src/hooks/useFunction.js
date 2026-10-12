import { useCallback, useRef } from 'react';
import { sdk } from '@/services/sdk';
import { toast } from 'sonner';
import { useFetch } from './useFetch';

/**
 * `result.ok` only reports transport success — the SDK's axios client is built with
 * `validateStatus: () => true`, so a 400/401/500 from the function still arrives as
 * `{ ok: true, value: <error body> }`. The status code is gone by the time we see it,
 * so the response body is the only signal left: treat `success: false` / `error` as a
 * failure, and treat a non-JSON body (an HTML error page) as one too.
 */
function unwrapFunctionResult(result) {
  if (!result?.ok) {
    const error = result?.error;
    throw Object.assign(new Error(error?.message || 'Function call failed'), {
      kind: error?.kind || 'unknown',
      cause: error,
    });
  }

  const value = result.value;

  // An edge function that answers with an error envelope, at ANY http status.
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value.success === false) {
      throw Object.assign(new Error(value.message || value.error || 'Function call failed'), { kind: 'provider', cause: value });
    }
    if (value.error) {
      const message = typeof value.error === 'string' ? value.error : value.error.message;
      throw Object.assign(new Error(message || 'Function call failed'), { kind: 'provider', cause: value });
    }
  }

  // A gateway/proxy error page reaches us as a raw HTML/text string instead of JSON.
  if (typeof value === 'string' && /^\s*</.test(value)) {
    throw Object.assign(new Error('Function call failed'), { kind: 'provider', cause: value });
  }

  return value;
}

export function useFunction(functionName, options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetcher = useCallback(async (body) => {
    const { successMessage, showError, ...sdkOptions } = optionsRef.current;
    // The payload is the SECOND argument, passed directly. Wrapping it (`{ body }`)
    // nests it one level deeper on the wire, and anything else spread in alongside
    // — including useFetch's AbortSignal — is serialized into the request body too.
    const result = await sdk.functions.invoke(functionName, body, sdkOptions);
    return unwrapFunctionResult(result);
  }, [functionName]);

  // `useFetch.run()` swallows the rejection and resolves `undefined`, so a try/catch
  // around it can never fire. Record the failure on the way through instead —
  // otherwise a failed call still fires `successMessage` and never shows the error.
  const failedRef = useRef(null);
  const guardedFetcher = useCallback(async (...args) => {
    failedRef.current = null;
    try {
      return await fetcher(...args);
    } catch (err) {
      failedRef.current = err;
      throw err; // keep useFetch's `error` state populated
    }
  }, [fetcher]);

  const { data, loading, error, run, setData } = useFetch(guardedFetcher, { initialLoading: false });

  const invoke = useCallback(async (...args) => {
    const result = await run(...args);
    const { successMessage, showError } = optionsRef.current;
    const err = failedRef.current;
    if (err) {
      if (showError !== false) toast.error(err.message || 'Function call failed');
      return undefined;
    }
    if (successMessage) toast.success(successMessage);
    return result;
  }, [run]);

  const reset = useCallback(() => setData(null), [setData]);

  return { invoke, loading, data, error, reset };
}
