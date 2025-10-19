import { NaverStockApiResponse, StockInfo, MARKET_STATUS_LABELS } from '@/types';

// 네이버 주식 API 기본 URL
const NAVER_STOCK_API_BASE_URL = 'https://m.stock.naver.com/api/stock';

/**
 * 네이버 주식 API에서 주식 정보를 가져옵니다
 * @param stockCode 6자리 주식 코드
 * @returns Promise<StockInfo>
 */
export async function getStockInfo(stockCode: string): Promise<StockInfo> {
  try {
    console.log(`주식 정보 조회 시도: ${stockCode}`);
    
    const response = await fetch(`${NAVER_STOCK_API_BASE_URL}/${stockCode}/basic`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': 'https://m.stock.naver.com/',
        'Origin': 'https://m.stock.naver.com',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API 호출 실패 - 코드: ${stockCode}, 상태: ${response.status}, 응답: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data: NaverStockApiResponse = await response.json();
    console.log(`주식 정보 조회 성공: ${stockCode} - ${data.stockName}`);
    return normalizeStockData(data);
  } catch (error) {
    console.error(`주식 정보 조회 실패 - 코드: ${stockCode}:`, error);
    throw new Error(`주식 정보를 가져올 수 없습니다: ${stockCode}`);
  }
}

/**
 * 네이버 API 응답을 앱에서 사용하는 StockInfo 형태로 정규화합니다
 * @param apiResponse 네이버 API 응답 데이터
 * @returns StockInfo
 */
export function normalizeStockData(apiResponse: NaverStockApiResponse): StockInfo {
  // 가격 문자열에서 쉼표 제거하고 숫자로 변환
  const parsePrice = (priceStr: string): number => {
    return parseFloat(priceStr.replace(/,/g, '')) || 0;
  };

  // 시장 상태 매핑
  const mapMarketStatus = (status: string): 'OPEN' | 'CLOSE' | 'PRE_MARKET' | 'AFTER_MARKET' => {
    switch (status) {
      case 'OPEN':
        return 'OPEN';
      case 'CLOSE':
        return 'CLOSE';
      case 'PRE_MARKET':
        return 'PRE_MARKET';
      case 'AFTER_MARKET':
        return 'AFTER_MARKET';
      default:
        return 'CLOSE';
    }
  };

  // 상승/하락 여부 판단
  const isRising = apiResponse.compareToPreviousPrice.code === '2'; // '2'는 상승을 의미

  return {
    code: apiResponse.itemCode,
    name: apiResponse.stockName,
    logoUrl: apiResponse.itemLogoUrl,
    currentPrice: parsePrice(apiResponse.closePrice),
    changeAmount: parsePrice(apiResponse.compareToPreviousClosePrice),
    changeRate: parseFloat(apiResponse.fluctuationsRatio) || 0,
    marketStatus: mapMarketStatus(apiResponse.marketStatus),
    marketName: apiResponse.stockExchangeType.nameKor,
    lastTradedAt: new Date(apiResponse.localTradedAt),
    isRising,
    // 추가 정보는 API에서 제공하지 않으므로 기본값 설정
    volume: 0,
  };
}

/**
 * 여러 주식 정보를 한 번에 가져옵니다
 * @param stockCodes 주식 코드 배열
 * @returns Promise<StockInfo[]>
 */
export async function getMultipleStockInfos(stockCodes: string[]): Promise<StockInfo[]> {
  console.log(`여러 주식 정보 조회 시작: ${stockCodes.join(', ')}`);
  
  const promises = stockCodes.map(code => getStockInfo(code));
  
  try {
    const results = await Promise.allSettled(promises);
    
    const successful = results
      .filter((result): result is PromiseFulfilledResult<StockInfo> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
    
    const failed = results
      .filter((result): result is PromiseRejectedResult => 
        result.status === 'rejected'
      );
    
    console.log(`주식 정보 조회 완료: 성공 ${successful.length}개, 실패 ${failed.length}개`);
    
    if (failed.length > 0) {
      console.log('실패한 주식 코드들:', failed.map(f => f.reason));
    }
    
    return successful;
  } catch (error) {
    console.error('여러 주식 정보 조회 실패:', error);
    return [];
  }
}

/**
 * 주식 코드 유효성 검사
 * @param stockCode 주식 코드
 * @returns boolean
 */
export function isValidStockCode(stockCode: string): boolean {
  return /^\d{6}$/.test(stockCode);
}

/**
 * 주식 이름으로 주식 코드를 검색합니다 (실제로는 네이버 검색 API가 필요하지만 여기서는 기본 구현)
 * @param stockName 주식 이름
 * @returns Promise<string[]>
 */
export async function searchStockByName(stockName: string): Promise<string[]> {
  // 실제 구현에서는 네이버 검색 API를 사용해야 합니다
  // 여기서는 기본적인 주식 코드들을 반환합니다
  const commonStocks: Record<string, string> = {
    '삼성전자': '005930',
    '네이버': '035420',
    'SK하이닉스': '000660',
    'LG화학': '051910',
    '현대차': '005380',
    '기아': '000270',
    'POSCO': '005490',
    'KB금융': '105560',
    '신한지주': '055550',
    'LG전자': '066570',
  };

  const matchedCodes = Object.entries(commonStocks)
    .filter(([name]) => name.includes(stockName) || stockName.includes(name))
    .map(([, code]) => code);

  return matchedCodes;
}
