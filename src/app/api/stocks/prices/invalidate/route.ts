import { NextRequest, NextResponse } from 'next/server';
import { invalidateStockPriceCache } from '@/lib/stock-cache';

export async function POST(request: NextRequest) {
  try {
    // 캐시 무효화 실행
    await invalidateStockPriceCache();
    
    return NextResponse.json({
      message: '주가 데이터 캐시가 성공적으로 무효화되었습니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('캐시 무효화 오류:', error);
    return NextResponse.json(
      { error: '캐시 무효화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
