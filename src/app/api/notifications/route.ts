import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

// 서버 사이드 Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * 알림 히스토리 조회 API
 * 사용자의 알림 발송 기록을 조회합니다.
 */
export async function GET(request: NextRequest) {
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

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 알림 히스토리 조회
    let query = supabase
      .from('notifications')
      .select(`
        id,
        triggered_price,
        cumulative_change_rate,
        sent_at,
        delivery_confirmed_at,
        created_at,
        subscription_id,
        condition_id,
        stock_subscriptions!inner(
          stock_code,
          stock_name,
          nation_type
        ),
        alert_conditions!inner(
          condition_type,
          threshold,
          period_days
        )
      `)
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 특정 구독의 알림만 조회하는 경우
    if (subscriptionId) {
      query = query.eq('subscription_id', subscriptionId);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('알림 히스토리 조회 오류:', error);
      return NextResponse.json(
        { error: '알림 히스토리를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 총 개수 조회 (페이징용)
    let countQuery = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (subscriptionId) {
      countQuery = countQuery.eq('subscription_id', subscriptionId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('알림 개수 조회 오류:', countError);
    }

    return NextResponse.json({
      success: true,
      data: notifications || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('알림 히스토리 API 오류:', error);
    return NextResponse.json(
      { 
        error: '알림 히스토리 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 알림 전달 확인 업데이트 API
 * 알림이 실제로 전달되었음을 확인합니다.
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { notificationId, deliveryConfirmed = true } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: '알림 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 알림 전달 확인 업데이트
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        delivery_confirmed_at: deliveryConfirmed
      })
      .eq('id', notificationId)
      .eq('user_id', user.id) // 사용자 소유 확인
      .select()
      .single();

    if (error) {
      console.error('알림 전달 확인 업데이트 오류:', error);
      return NextResponse.json(
        { error: '알림 전달 확인 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('알림 전달 확인 API 오류:', error);
    return NextResponse.json(
      { 
        error: '알림 전달 확인 업데이트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
