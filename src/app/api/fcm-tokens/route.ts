import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

// 서버 사이드 Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * FCM 토큰 등록 API
 * 사용자의 디바이스에서 FCM 토큰을 등록합니다.
 */
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

    // 사용자가 users 테이블에 존재하는지 확인 (생성하지 않음)
    const { data: userRecord, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userCheckError || !userRecord) {
      console.error('사용자 정보가 없습니다. 먼저 로그인해주세요:', user.id);
      return NextResponse.json(
        { 
          error: '사용자 정보가 없습니다. 먼저 로그인해주세요.',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      token: fcmToken, 
      deviceType = 'web',
      deviceInfo = null 
    } = body;

    if (!fcmToken) {
      return NextResponse.json(
        { error: 'FCM 토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    // 기존 토큰 확인 (동일한 토큰)
    const { data: existingToken } = await supabase
      .from('fcm_tokens')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('token', fcmToken)
      .single();

    if (existingToken) {
      // 기존 토큰이 있으면 활성화 상태 업데이트
      const { error: updateError } = await supabase
        .from('fcm_tokens')
        .update({
          is_active: true,
          last_used_at: new Date().toISOString(),
          device_type: deviceType,
          device_info: deviceInfo
        })
        .eq('id', existingToken.id);

      if (updateError) {
        console.error('FCM 토큰 업데이트 오류:', updateError);
        return NextResponse.json(
          { error: '토큰 업데이트 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'FCM 토큰이 업데이트되었습니다.',
        tokenId: existingToken.id
      });
    } else {
      // 새 토큰 등록 전에 기존 모든 토큰 비활성화
      const { error: deactivateError } = await supabase
        .from('fcm_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (deactivateError) {
        console.error('기존 토큰 비활성화 오류:', deactivateError);
        // 비활성화 실패해도 새 토큰 등록은 계속 진행
      }

      // 새 토큰 등록
      const { data: newToken, error: insertError } = await supabase
        .from('fcm_tokens')
        .insert({
          user_id: user.id,
          token: fcmToken,
          device_type: deviceType,
          device_info: deviceInfo,
          is_active: true,
          last_used_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('FCM 토큰 등록 오류:', insertError);
        return NextResponse.json(
          { error: '토큰 등록 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'FCM 토큰이 등록되었습니다.',
        tokenId: newToken.id
      });
    }

  } catch (error) {
    console.error('FCM 토큰 등록 API 오류:', error);
    return NextResponse.json(
      { 
        error: 'FCM 토큰 등록 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * FCM 토큰 삭제 API
 */
export async function DELETE(request: NextRequest) {
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

    // 사용자가 users 테이블에 존재하는지 확인 (생성하지 않음)
    const { data: userRecord, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userCheckError || !userRecord) {
      console.error('사용자 정보가 없습니다. 먼저 로그인해주세요:', user.id);
      return NextResponse.json(
        { 
          error: '사용자 정보가 없습니다. 먼저 로그인해주세요.',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { token: fcmToken } = body;

    if (!fcmToken) {
      return NextResponse.json(
        { error: 'FCM 토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    // 토큰 비활성화
    const { error: updateError } = await supabase
      .from('fcm_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('token', fcmToken);

    if (updateError) {
      console.error('FCM 토큰 삭제 오류:', updateError);
      return NextResponse.json(
        { error: '토큰 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'FCM 토큰이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('FCM 토큰 삭제 API 오류:', error);
    return NextResponse.json(
      { 
        error: 'FCM 토큰 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 사용자의 FCM 토큰 목록 조회 API
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

    // 사용자가 users 테이블에 존재하는지 확인 (생성하지 않음)
    const { data: userRecord, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userCheckError || !userRecord) {
      console.error('사용자 정보가 없습니다. 먼저 로그인해주세요:', user.id);
      return NextResponse.json(
        { 
          error: '사용자 정보가 없습니다. 먼저 로그인해주세요.',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // 사용자의 활성 FCM 토큰 조회
    const { data: tokens, error: selectError } = await supabase
      .from('fcm_tokens')
      .select('id, token, device_type, device_info, is_active, created_at, last_used_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_used_at', { ascending: false });

    if (selectError) {
      console.error('FCM 토큰 조회 오류:', selectError);
      return NextResponse.json(
        { error: '토큰 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tokens: tokens || [],
      count: tokens?.length || 0
    });

  } catch (error) {
    console.error('FCM 토큰 조회 API 오류:', error);
    return NextResponse.json(
      { 
        error: 'FCM 토큰 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
