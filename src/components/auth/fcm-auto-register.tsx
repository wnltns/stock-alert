'use client';

import { useEffect } from 'react';
import { useFcmAutoRegistration } from '@/hooks/use-fcm';

export default function FcmAutoRegister() {
  const { isSupported, isRegistered, error } = useFcmAutoRegistration();

  useEffect(() => {
    if (error) {
      console.warn('FCM 자동 등록 오류:', error);
    }
  }, [error]);

  // UI에는 노출하지 않고 사이드이펙트만 수행
  return null;
}


