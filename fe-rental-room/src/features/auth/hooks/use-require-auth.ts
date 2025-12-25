/**
 * Hook để xử lý redirect sang login với callback URL
 */

"use client"

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCallback } from 'react'
import { saveCallbackUrl } from '@/lib/redirect-after-login'

export function useRequireAuth() {
  const router = useRouter()
  const { data: session } = useSession()

  /**
   * Redirect sang login nếu chưa đăng nhập, lưu URL callback
   * @param redirectUrl - URL để redirect sau khi login thành công
   */
  const requireLogin = useCallback((redirectUrl?: string) => {
    if (!session?.user) {
      // Lưu URL callback
      const toSave = redirectUrl || (typeof window !== 'undefined' ? window.location.pathname : undefined);
      console.debug('[auth] requireLogin -> saving callback:', toSave);
      saveCallbackUrl(toSave)
      // Redirect sang login
      router.push('/login')
    }
  }, [session, router])

  return { requireLogin, isLoggedIn: !!session?.user }
}
