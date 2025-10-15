import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedStockPricesWithCache } from '@/lib/stock-cache';
import type { Database } from '@/types';

// 서버 사이드 Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 사용자 ID 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰에서 사용자 정보 추출
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 인증 토큰입니다.' },
        { status: 401 }
      );
    }

    // 캐시된 주가 데이터 조회
    const stockDetails = await getCachedStockPricesWithCache(user.id);

    // 알림 조건 데이터도 함께 조회
    if (stockDetails.length > 0) {
      const { data: conditions, error: conditionsError } = await supabase
        .from('alert_conditions')
        .select('*')
        .in('subscription_id', stockDetails.map(item => item.subscription.id));

      if (conditionsError) {
        console.warn('알림 조건 조회 중 오류:', conditionsError);
      }

      // 주가 데이터와 조건 데이터를 결합
      const stocksWithConditions = stockDetails.map(item => ({
        ...item,
        conditions: conditions?.filter(condition => 
          condition.subscription_id === item.subscription.id
        ) || []
      }));

      return NextResponse.json({
        message: '주가 데이터를 성공적으로 가져왔습니다.',
        data: stocksWithConditions,
        cached: true // 캐시 사용 여부 표시
      });
    }

    return NextResponse.json({
      message: '등록된 주식이 없습니다.',
      data: []
    });

  } catch (error) {
    console.error('주가 데이터 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}