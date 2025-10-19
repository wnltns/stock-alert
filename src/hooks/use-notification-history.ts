import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase/client';

interface NotificationHistory {
  id: string;
  subscription_id: string;
  condition_id: string;
  triggered_price: number;
  cumulative_change_rate: number;
  sent_at: string | null;
  delivery_confirmed_at: boolean | null;
  created_at: string | null;
  stock_subscriptions?: {
    stock_code: string;
    stock_name: string;
    nation_type: string;
  };
  alert_conditions?: {
    condition_type: string;
    threshold: number;
    period_days: number;
  };
}

interface UseNotificationHistoryReturn {
  notifications: NotificationHistory[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  fetchNotifications: (subscriptionId?: string, refresh?: boolean) => Promise<void>;
  updateDeliveryStatus: (notificationId: string, confirmed: boolean) => Promise<void>;
  clearNotifications: () => void;
}

/**
 * 알림 히스토리 관리를 위한 커스텀 훅
 */
export function useNotificationHistory(): UseNotificationHistoryReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);

  const LIMIT = 20;

  // 알림 히스토리 조회
  const fetchNotifications = useCallback(async (
    subscriptionId?: string, 
    refresh: boolean = false
  ) => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const offset = refresh ? 0 : currentOffset;
      
      // 현재 사용자의 세션 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: offset.toString(),
      });

      if (subscriptionId) {
        params.append('subscription_id', subscriptionId);
      }

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '알림 히스토리 조회에 실패했습니다.');
      }

      if (refresh) {
        setNotifications(data.data || []);
        setCurrentOffset(LIMIT);
      } else {
        setNotifications(prev => [...prev, ...(data.data || [])]);
        setCurrentOffset(prev => prev + LIMIT);
      }

      setTotal(data.pagination?.total || 0);
      setHasMore(data.pagination?.hasMore || false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알림 히스토리 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('알림 히스토리 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentOffset]);

  // 알림 전달 상태 업데이트
  const updateDeliveryStatus = useCallback(async (
    notificationId: string, 
    confirmed: boolean
  ): Promise<void> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      // 현재 사용자의 세션 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          notificationId,
          deliveryConfirmed: confirmed
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '알림 상태 업데이트에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, delivery_confirmed_at: confirmed }
            : notification
        )
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알림 상태 업데이트 중 오류가 발생했습니다.';
      console.error('알림 상태 업데이트 오류:', err);
      throw new Error(errorMessage);
    }
  }, [user]);

  // 알림 히스토리 초기화
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setError(null);
    setTotal(0);
    setHasMore(false);
    setCurrentOffset(0);
  }, []);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    if (user) {
      fetchNotifications(undefined, true);
    }
  }, [user]); // fetchNotifications를 의존성에서 제거

  return {
    notifications,
    loading,
    error,
    total,
    hasMore,
    fetchNotifications,
    updateDeliveryStatus,
    clearNotifications,
  };
}
