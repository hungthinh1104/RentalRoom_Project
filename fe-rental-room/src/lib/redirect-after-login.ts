import type { ReadonlyURLSearchParams } from 'next/navigation';

/**
 * Utility to manage redirect URL after login
 * Lưu URL mà user muốn truy cập trước khi redirect sang login
 */

const CALLBACK_URL_KEY = 'loginCallbackUrl';

/**
 * Lưu URL hiện tại trước khi redirect sang login
 * @param url - URL để redirect sau login
 */
export function saveCallbackUrl(url?: string) {
  if (typeof window === 'undefined') return;
  
  if (url && url !== '/login') {
    console.debug('[redirect] saveCallbackUrl:', url);
    sessionStorage.setItem(CALLBACK_URL_KEY, url);
  }
}

/**
 * Lấy URL được lưu và xóa nó
 * @returns URL callback hoặc null
 */
export function getAndClearCallbackUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const url = sessionStorage.getItem(CALLBACK_URL_KEY);
  if (url) {
    console.debug('[redirect] getAndClearCallbackUrl ->', url);
    sessionStorage.removeItem(CALLBACK_URL_KEY);
  }
  return url;
}

/**
 * Lấy callbackUrl từ URL params (từ NextAuth)
 * @param searchParams - URL search params
 * @returns callbackUrl hoặc default path
 */
export function getCallbackUrl(searchParams: ReadonlyURLSearchParams | undefined, role?: string): string {
  // Nếu có callbackUrl trong URL params (từ NextAuth)
  // Next.js useSearchParams returns ReadonlyURLSearchParams
  const paramCallback = searchParams?.get('callbackUrl');
  if (paramCallback && !paramCallback.includes('/login')) {
    return paramCallback;
  }

  // Nếu có URL lưu trong sessionStorage
  if (typeof window !== 'undefined') {
    const savedUrl = getAndClearCallbackUrl();
    if (savedUrl) return savedUrl;
  }

  // Default redirect theo role
  const defaultPath = role === 'admin'
    ? '/dashboard/admin'
    : role === 'landlord'
      ? '/dashboard/landlord'
      : '/dashboard/tenant';

  return defaultPath;
}

/**
 * Normalize a redirect target: if it's a relative path, return it.
 * If it is an absolute URL within the same origin, return its pathname + search + hash.
 * Otherwise, return default dashboard path per role.
 */
export function normalizeRedirectTarget(target?: string | null, role?: string): string {
  const defaultPath = role === 'admin' ? '/dashboard/admin' : role === 'landlord' ? '/dashboard/landlord' : '/dashboard/tenant';
  if (!target || typeof target !== 'string') return defaultPath;
  try {
    if (target.startsWith('/')) return target;
    // try parse absolute url; if same origin, use its pathname
    if (typeof window !== 'undefined') {
      const parsed = new URL(target);
      if (parsed.origin === window.location.origin) {
        return parsed.pathname + parsed.search + parsed.hash;
      }
    }
  } catch (e) {
    // invalid url, fallback
    console.warn('[redirect] normalizeRedirectTarget invalid target', target, e);
  }
  return defaultPath;
}
