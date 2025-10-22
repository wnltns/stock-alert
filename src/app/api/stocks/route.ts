import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

// 서버 사이드 Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { stockUrl } = await request.json();

    // 입력 데이터 검증
    if (!stockUrl) {
      return NextResponse.json(
        { error: '주식 URL을 입력해주세요.' },
        { status: 400 }
      );
    }

    // URL 형식 검증 (간단한 검사만)
    if (!stockUrl.includes('m.stock.naver.com') || !stockUrl.includes('/total')) {
      return NextResponse.json(
        { error: '올바른 네이버 주식 URL 형식을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 주식 코드 추출
    let stockCode: string | null = null;
    let urlType: string = '';
    
    // 모든 패턴에서 주식 코드 추출
    const patterns = [
      { pattern: /\/domestic\/stock\/([^\/]+)\/total$/, type: 'domestic' },
      { pattern: /\/worldstock\/stock\/([^\/]+)\/total$/, type: 'worldstock' },
      { pattern: /\/worldstock\/etf\/([^\/]+)\/total$/, type: 'worldetf' },
      { pattern: /\/worldstock\/index\/([^\/]+)\/total$/, type: 'worldindex' }
    ];
    
    for (const { pattern, type } of patterns) {
      const match = stockUrl.match(pattern);
      if (match) {
        stockCode = match[1];
        urlType = type;
        break;
      }
    }
    
    if (!stockCode) {
      return NextResponse.json(
        { error: '주식 코드를 추출할 수 없습니다.' },
        { status: 400 }
      );
    }

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

    // 네이버 주식 API 호출하여 주식 정보 가져오기
    let stockName = '';
    let nationType = 'KOR'; // 데이터베이스 제약 조건에 맞게 기본값 설정
    
    // API 엔드포인트 결정
    const getApiEndpoints = (urlType: string, stockCode: string) => {
      switch (urlType) {
        case 'domestic':
          return [`https://m.stock.naver.com/api/stock/${stockCode}/basic`];
        case 'worldstock':
          return [
            `https://api.stock.naver.com/stock/${stockCode}/basic`,
            `https://m.stock.naver.com/api/stock/${stockCode}/basic`
          ];
        case 'worldetf':
          return [`https://api.stock.naver.com/etf/${stockCode}/basic`];
        case 'worldindex':
          return [`https://api.stock.naver.com/index/${stockCode}/basic`];
        default:
          return [];
      }
    };

    const apiEndpoints = getApiEndpoints(urlType, stockCode);
    let apiSuccess = false;
    let lastError: Error | null = null;

    for (const apiUrl of apiEndpoints) {
      try {
        console.log(`API 호출 시도: ${apiUrl}`);
        
        const naverResponse = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
          },
        });

        if (!naverResponse.ok) {
          throw new Error(`API 호출 실패: ${naverResponse.status}`);
        }

        const naverData = await naverResponse.json();
        
        // 디버깅을 위한 로그
        console.log('네이버 API 응답:', {
          stockName: naverData.stockName,
          indexName: naverData.indexName,
          nationType: naverData.nationType,
          stockCode: naverData.itemCode,
          urlType,
          apiUrl
        });
        
        // 주식명 추출 (지수는 indexName 필드 사용)
        let extractedName = '';
        if (urlType === 'worldindex' && naverData.indexName) {
          extractedName = naverData.indexName;
        } else if (naverData.stockName) {
          extractedName = naverData.stockName;
        }
        
        if (extractedName) {
          stockName = extractedName;
          // 데이터베이스 제약 조건에 맞게 nationType 변환
          const apiNationType = naverData.nationType || (urlType === 'domestic' ? 'KOR' : 'FOREIGN');
          nationType = apiNationType === 'KOR' ? 'KOR' : 'FOREIGN';
          apiSuccess = true;
          
          // 성공한 API 정보를 저장
          const apiInfo = {
            stock_code: stockCode,
            stock_name: extractedName,
            nation_type: nationType,
            api_endpoint: apiUrl,
            api_response: naverData,
            last_updated: new Date().toISOString(),
          };
          
          console.log('성공한 API 정보 저장:', apiInfo);
          break;
        }
      } catch (error) {
        console.log(`API 호출 실패: ${apiUrl}`, error);
        lastError = error instanceof Error ? error : new Error('알 수 없는 오류');
        continue;
      }
    }

    if (!apiSuccess) {
      console.error('모든 API 호출 실패:', lastError);
      return NextResponse.json(
        { error: '주식 정보를 가져올 수 없습니다. 주식 코드를 확인해주세요.' },
        { status: 400 }
      );
    }

    // 중복 주식 코드 확인 (특수 문자가 포함된 주식 코드 처리)
    try {
      const { data: existingStocks, error: checkError } = await supabase
        .from('stock_subscriptions')
        .select('id, stock_code')
        .eq('user_id', user.id);

      if (checkError) {
        console.error('중복 확인 중 오류:', checkError);
        return NextResponse.json(
          { error: '주식 등록 확인 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // 클라이언트 사이드에서 중복 확인 (특수 문자 처리 문제 회피)
      const isDuplicate = existingStocks?.some(stock => stock.stock_code === stockCode);
      
      if (isDuplicate) {
        return NextResponse.json(
          { error: '이미 등록된 주식 코드입니다.' },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('중복 확인 중 예외 발생:', error);
      return NextResponse.json(
        { error: '주식 등록 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 주식 구독 정보 삽입
    let marketValue = 'KOSPI'; // 기본값
    if (urlType === 'domestic') {
      marketValue = 'KOSPI'; // 국내 주식
    } else if (urlType === 'worldstock') {
      marketValue = 'NASDAQ'; // 해외 주식
    } else if (urlType === 'worldetf') {
      marketValue = 'NASDAQ'; // 해외 ETF
    } else if (urlType === 'worldindex') {
      marketValue = 'NASDAQ'; // 해외 지수
    }

    // 성공한 API 정보를 JSON으로 저장
    const apiInfo = {
      endpoint: apiEndpoints.find(url => url.includes(stockCode)) || '',
      last_successful_call: new Date().toISOString(),
      url_type: urlType,
    };

    const { data: newStock, error: insertError } = await supabase
      .from('stock_subscriptions')
      .insert({
        user_id: user.id,
        stock_code: stockCode,
        stock_name: stockName,
        market: marketValue,
        nation_type: nationType,
        is_active: true,
        api_info: apiInfo, // API 정보 저장
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error('주식 등록 중 오류:', insertError);
      return NextResponse.json(
        { error: '주식 등록 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 주식 등록 성공 후 캐시 무효화
    try {
      const { invalidateStockPriceCache } = await import('@/lib/stock-cache');
      await invalidateStockPriceCache();
      console.log('주식 등록 후 캐시 무효화 완료');
    } catch (cacheError) {
      console.warn('캐시 무효화 중 오류 (무시됨):', cacheError);
    }

    return NextResponse.json(
      { 
        message: '주식이 성공적으로 등록되었습니다.',
        data: {
          ...(newStock as any),
          stock_name: stockName,
          nation_type: nationType
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('주식 등록 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
