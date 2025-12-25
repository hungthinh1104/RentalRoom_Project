import { useCallback } from 'react';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant }: ToastOptions) => {
      const message = `${title ? title + ': ' : ''}${description || ''}`;
      
      if (variant === 'destructive') {
        console.error(message);
      } else {
        console.log(message);
      }

      // Optional: Use browser's native notification API if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title || 'Notification', {
          body: description,
          icon: '/favicon.ico',
        });
      }
    },
    [],
  );

  return { toast };
}
