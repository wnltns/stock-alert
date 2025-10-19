import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase/client';

interface FcmToken {
  id: string;
  token: string;
  device_type: string;
  device_info: any;
  is_active: boolean;
  created_at: string;
  last_used_at: string;
}

interface UseFcmTokensReturn {
  tokens: FcmToken[];
  isLoading: boolean;
  error: string | null;
  registerToken: (token: string, deviceType?: string, deviceInfo?: any) => Promise<boolean>;
  unregisterToken: (token: string) => Promise<boolean>;
  refreshTokens: () => Promise<void>;
}

/**
 * FCM 토큰 관리를 위한 커스텀 훅
 */
export function useFcmTokens(): UseFcmTokensReturn {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<FcmToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FCM 토큰 목록 조회
  const fetchTokens = useCallback(async () => {
    if (!user) {
      setTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 현재 사용자의 세션 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch('/api/fcm-tokens', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '토큰 조회에 실패했습니다.');
      }

      setTokens(data.tokens || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '토큰 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('FCM 토큰 조회 오류:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // FCM 토큰 등록
  const registerToken = useCallback(async (
    token: string, 
    deviceType: string = 'web', 
    deviceInfo: any = null
  ): Promise<boolean> => {
    if (!user) {
      setError('로그인이 필요합니다.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 현재 사용자의 세션 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch('/api/fcm-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          token,
          deviceType,
          deviceInfo
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '토큰 등록에 실패했습니다.');
      }

      // 토큰 목록 새로고침
      await fetchTokens();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '토큰 등록 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('FCM 토큰 등록 오류:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchTokens]);

  // FCM 토큰 삭제
  const unregisterToken = useCallback(async (token: string): Promise<boolean> => {
    if (!user) {
      setError('로그인이 필요합니다.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 현재 사용자의 세션 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch('/api/fcm-tokens', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '토큰 삭제에 실패했습니다.');
      }

      // 토큰 목록 새로고침
      await fetchTokens();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '토큰 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('FCM 토큰 삭제 오류:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchTokens]);

  // 토큰 목록 새로고침
  const refreshTokens = useCallback(async () => {
    await fetchTokens();
  }, [fetchTokens]);

  // 컴포넌트 마운트 시 토큰 목록 조회
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return {
    tokens,
    isLoading,
    error,
    registerToken,
    unregisterToken,
    refreshTokens,
  };
}

/**
 * 브라우저에서 FCM 토큰을 자동으로 등록하는 훅
 */
export function useFcmAutoRegistration(): {
  isSupported: boolean;
  isRegistered: boolean;
  error: string | null;
} {
  const { user } = useAuth();
  const { registerToken, tokens } = useFcmTokens();
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Service Worker와 FCM 지원 확인
    if ('serviceWorker' in navigator && 'Notification' in window) {
      setIsSupported(true);
    } else {
      setError('이 브라우저는 FCM을 지원하지 않습니다.');
      return;
    }

    // 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission !== 'granted') {
          setError('알림 권한이 거부되었습니다.');
          return;
        }
      });
    } else if (Notification.permission === 'denied') {
      setError('알림 권한이 거부되었습니다.');
      return;
    }

    // Firebase 초기화 및 토큰 등록
    const initializeFcm = async () => {
      try {
        // Firebase 앱이 이미 초기화되어 있는지 확인
        if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
          console.warn('Firebase가 초기화되지 않았습니다. FCM 토큰을 등록할 수 없습니다.');
          return;
        }

        const messaging = window.firebase.messaging();
        
        // 현재 토큰 가져오기
        const currentToken = await messaging.getToken({
          vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY
        });

        if (currentToken) {
          // 토큰이 이미 등록되어 있는지 확인
          const isAlreadyRegistered = tokens.some(t => t.token === currentToken);
          
          if (!isAlreadyRegistered) {
            const success = await registerToken(currentToken, 'web', {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language
            });
            
            if (success) {
              setIsRegistered(true);
              console.log('FCM 토큰이 성공적으로 등록되었습니다.');
            }
          } else {
            setIsRegistered(true);
          }
        } else {
          setError('FCM 토큰을 가져올 수 없습니다.');
        }

        // 토큰 새로고침 이벤트 리스너
        messaging.onTokenRefresh(async () => {
          try {
            const newToken = await messaging.getToken({
              vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY
            });
            
            if (newToken) {
              await registerToken(newToken, 'web', {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
              });
              console.log('FCM 토큰이 새로고침되었습니다.');
            }
          } catch (err) {
            console.error('FCM 토큰 새로고침 오류:', err);
          }
        });

        // 메시지 수신 이벤트 리스너
        messaging.onMessage((payload: any) => {
          console.log('FCM 메시지 수신:', payload);
          
          // 브라우저 알림 표시
          if (payload.notification) {
            const notification = new Notification(payload.notification.title, {
              body: payload.notification.body,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: payload.data?.subscription_id || 'stock-alert',
              requireInteraction: true
            });

            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'FCM 초기화 중 오류가 발생했습니다.';
        setError(errorMessage);
        console.error('FCM 초기화 오류:', err);
      }
    };

    if (user && isSupported) {
      initializeFcm();
    }
  }, [user, isSupported, registerToken, tokens]);

  return {
    isSupported,
    isRegistered,
    error,
  };
}

// Firebase 타입 선언 (전역)
declare global {
  interface Window {
    firebase: any;
  }
}
