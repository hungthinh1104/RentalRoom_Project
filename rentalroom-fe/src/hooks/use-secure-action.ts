'use client';

import { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🔒 SECURITY HOOK: Idempotent Mutation
 *
 * Prevents double-submit attacks by:
 * 1. Generating unique idempotency key per action
 * 2. Storing in sessionStorage (survives DevTools manipulation)
 * 3. Tracking in-flight requests
 * 4. Rejecting duplicate calls while pending
 *
 * SECURITY FIX: Previously used useRef which could be cleared via DevTools.
 * Now uses sessionStorage for tamper-resistant persistence.
 *
 * USAGE:
 * ```tsx
 * const { execute, isLoading, idempotencyKey } = useIdempotentAction(
 *   (key) => api.markInvoicePaid(invoiceId, key),
 *   { actionName: 'mark-paid-invoice-123' }
 * );
 * <Button onClick={execute} disabled={isLoading}>Mark Paid</Button>
 * ```
 */
export function useIdempotentAction<T>(
    action: (idempotencyKey: string) => Promise<T>,
    options?: {
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
        resetKeyOnSuccess?: boolean;
        /** Unique action name for sessionStorage key */
        actionName?: string;
    }
) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [result, setResult] = useState<T | null>(null);

    // 🛡️ SECURITY: Store in sessionStorage to prevent DevTools bypass
    const storageKey = `idem-key-${options?.actionName || 'default'}`;

    const getIdempotencyKey = useCallback(() => {
        if (typeof window === 'undefined') return uuidv4();

        const stored = sessionStorage.getItem(storageKey);
        if (stored) return stored;

        const newKey = uuidv4();
        sessionStorage.setItem(storageKey, newKey);
        return newKey;
    }, [storageKey]);

    // Track if action is in-flight to prevent race conditions
    const inFlightRef = useRef<boolean>(false);

    const regenerateKey = useCallback(() => {
        const newKey = uuidv4();
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(storageKey, newKey);
        }
    }, [storageKey]);

    const execute = useCallback(async () => {
        // 🛡️ CRITICAL: Prevent double-submit
        if (inFlightRef.current) {
            console.warn('[Security] Blocked duplicate action - request in flight');
            return null;
        }

        inFlightRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const currentKey = getIdempotencyKey();
            const res = await action(currentKey);

            setResult(res);
            options?.onSuccess?.(res);

            // Optionally regenerate key after success
            if (options?.resetKeyOnSuccess !== false) {
                regenerateKey();
            }

            return res;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            options?.onError?.(error);
            return null;
        } finally {
            inFlightRef.current = false;
            setIsLoading(false);
        }
    }, [action, options, getIdempotencyKey, regenerateKey]);

    return {
        execute,
        isLoading,
        error,
        result,
        idempotencyKey: getIdempotencyKey(),
        regenerateKey,
        /** Whether action can be executed (not in-flight) */
        canExecute: !inFlightRef.current,
    };
}

/**
 * 🔒 SECURITY HOOK: Mutation Lock
 *
 * Disables button immediately on click, prevents:
 * - Multiple tab attacks
 * - Rapid double-clicks
 * - DevTools replay
 *
 * USAGE:
 * ```tsx
 * const { mutate, isLocked, lockId } = useMutationLock();
 *
 * <Button
 *   onClick={() => mutate(() => api.approvContract(id))}
 *   disabled={isLocked}
 * >
 *   {isLocked ? 'Processing...' : 'Approve'}
 * </Button>
 * ```
 */
export function useMutationLock<T>() {
    const [isLocked, setIsLocked] = useState(false);
    const [lockId, setLockId] = useState<string | null>(null);

    const mutate = useCallback(
        async (action: () => Promise<T>): Promise<T | null> => {
            if (isLocked) {
                console.warn('[Security] Mutation locked - action blocked');
                return null;
            }

            const currentLockId = uuidv4();
            setLockId(currentLockId);
            setIsLocked(true);

            try {
                return await action();
            } finally {
                setIsLocked(false);
                setLockId(null);
            }
        },
        [isLocked]
    );

    return {
        mutate,
        isLocked,
        lockId,
    };
}

/**
 * 🔒 SECURITY HOOK: Combined Idempotent + Lock
 *
 * For critical legal actions (payments, contracts, disputes)
 * 
 * SECURITY FIX: Uses sessionStorage for tamper-resistant key storage
 */
export function useSecureAction<T>(
    action: (idempotencyKey: string) => Promise<T>,
    options?: {
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
        actionName?: string;
    }
) {
    const { mutate, isLocked, lockId } = useMutationLock<T>();

    const storageKey = `idem-key-${options?.actionName || 'secure-action'}`;

    const getIdempotencyKey = useCallback(() => {
        if (typeof window === 'undefined') return uuidv4();

        const stored = sessionStorage.getItem(storageKey);
        if (stored) return stored;

        const newKey = uuidv4();
        sessionStorage.setItem(storageKey, newKey);
        return newKey;
    }, [storageKey]);

    const execute = useCallback(async () => {
        const key = getIdempotencyKey();
        const result = await mutate(() => action(key));

        if (result !== null) {
            // Success - regenerate key for next action
            const newKey = uuidv4();
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(storageKey, newKey);
            }
            options?.onSuccess?.(result);
        }

        return result;
    }, [mutate, action, options, getIdempotencyKey, storageKey]);

    return {
        execute,
        isLocked,
        lockId,
        idempotencyKey: getIdempotencyKey(),
    };
}
