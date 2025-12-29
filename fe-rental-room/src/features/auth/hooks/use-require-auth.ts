/**
 * Hook để xử lý redirect sang login với callback URL
 */

"use client"

import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCallback } from 'react'
import { saveCallbackUrl as saveRedirectUrl } from '@/lib/redirect-after-login'

export function useRequireAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  /**
   * Redirect sang login nếu chưa đăng nhập, lưu URL callback
   * @param redirectUrl - URL để redirect sau khi login thành công
   */
  const requireLogin = useCallback((redirectUrl?: string): boolean => {
    if (!session?.user) {
      const toSave = redirectUrl || pathname;
      console.debug('[auth] requireLogin -> saving callback:', toSave);
      saveRedirectUrl(toSave);
      router.push('/auth/login');
      return false;
    }
    return true;
  }, [session, pathname, router]);

  return { requireLogin, isLoggedIn: !!session?.user }
}
