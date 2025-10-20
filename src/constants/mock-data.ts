import { StockSubscription, AlertCondition, StockInfo, StockDetail, AlertHistory } from '@/types';

// Mock 데이터 - 실제 API 연동 없이 개발용 데이터
export const MOCK_STOCK_SUBSCRIPTIONS: StockSubscription[] = [
  {
    id: '1',
    user_id: 'user1',
    stock_code: '004731',
    stock_name: 'LG',
    market: 'KOSPI',
    nation_type: 'KR',
    api_info: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user1',
    stock_code: '035420',
    stock_name: '네이버',
    market: 'KOSPI',
    nation_type: 'KR',
    api_info: null,
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    user_id: 'user1',
    stock_code: '000660',
    stock_name: 'SK하이닉스',
    market: 'KOSPI',
    nation_type: 'KR',
    api_info: null,
    is_active: true,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

export const MOCK_ALERT_CONDITIONS: AlertCondition[] = [
  {
    id: '1',
    subscription_id: '1',
    condition_type: 'drop',
    threshold: 4.0,
    period_days: 1,
    cumulative_change_rate: 0,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_checked_at: null,
    tracking_started_at: null,
    tracking_ended_at: null,
  },
  {
    id: '2',
    subscription_id: '1',
    condition_type: 'rise',
    threshold: 8.0,
    period_days: 3,
    cumulative_change_rate: 0,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_checked_at: null,
    tracking_started_at: null,
    tracking_ended_at: null,
  },
  {
    id: '3',
    subscription_id: '2',
    condition_type: 'rise',
    threshold: 5.0,
    period_days: 1,
    cumulative_change_rate: 0,
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    last_checked_at: null,
    tracking_started_at: null,
    tracking_ended_at: null,
  },
];

export const MOCK_STOCK_INFOS: StockInfo[] = [
  {
    code: '004731',
    name: 'LG',
    logoUrl: 'https://ssl.pstatic.net/imgstock/fn/real/logo/stock/Stock004731.svg',
    currentPrice: 95000,  // API 응답의 closePrice "95,000" 기반
    changeAmount: 3400,   // API 응답의 compareToPreviousClosePrice "3,400" 기반
    changeRate: 3.71,     // API 응답의 fluctuationsRatio "3.71" 기반
    marketStatus: 'CLOSE', // API 응답의 marketStatus "CLOSE" 기반
    marketName: 'KOSPI',   // API 응답의 stockExchangeType.nameKor "코스피" 기반
    lastTradedAt: new Date('2025-10-15T16:10:13+09:00'), // API 응답의 localTradedAt 기반
    isRising: true,       // API 응답의 compareToPreviousPrice.code "2" (상승) 기반
    // API 응답에 없는 필드들은 기본값으로 설정
    volume: 0,
  },
  {
    code: '035420',
    name: '네이버',
    logoUrl: 'https://ssl.pstatic.net/imgstock/fn/real/logo/stock/Stock035420.svg',
    currentPrice: 210000,
    changeAmount: 10000,
    changeRate: 5.0,
    marketStatus: 'CLOSE',
    marketName: 'KOSPI',
    lastTradedAt: new Date(),
    isRising: true,
    volume: 0,
  },
  {
    code: '000660',
    name: 'SK하이닉스',
    logoUrl: 'https://ssl.pstatic.net/imgstock/fn/real/logo/stock/Stock000660.svg',
    currentPrice: 120000,
    changeAmount: 3000,
    changeRate: 2.5,
    marketStatus: 'CLOSE',
    marketName: 'KOSPI',
    lastTradedAt: new Date(),
    isRising: true,
    volume: 0,
  },
];

// Mock 데이터를 조합하여 StockDetail 생성
export const MOCK_STOCK_DETAILS: StockDetail[] = MOCK_STOCK_SUBSCRIPTIONS.map(subscription => {
  const stockInfo = MOCK_STOCK_INFOS.find(info => info.code === subscription.stock_code);
  const conditions = MOCK_ALERT_CONDITIONS.filter(c => c.subscription_id === subscription.id);
  
  return {
    subscription,
    stockInfo: stockInfo || {
      code: subscription.stock_code,
      name: subscription.stock_name,
      logoUrl: '',
      currentPrice: 0,
      changeAmount: 0,
      changeRate: 0,
      marketStatus: 'CLOSE',
      marketName: subscription.market,
      lastTradedAt: new Date(),
      isRising: false,
    },
    conditions,
  };
});

// 상수 정의
export const STOCK_CODE_REGEX = /^\d{6}$/; // 6자리 숫자
export const MAX_CONDITIONS_PER_STOCK = 5;
export const DEFAULT_REFRESH_TIME = 18; // 오후 6시
export const MIN_THRESHOLD = 0.1; // 최소 0.1%
export const MAX_THRESHOLD = 100; // 최대 100%
export const MIN_PERIOD = 1; // 최소 1일
export const MAX_PERIOD = 30; // 최대 30일

// Mock 알림 히스토리 데이터
export const MOCK_ALERT_HISTORY: AlertHistory[] = [
  {
    id: '1',
    subscription_id: '1',
    condition_id: '1',
    stock_code: '004731',
    stock_name: 'LG',
    condition_type: 'drop',
    threshold: 4.0,
    period_days: 1,
    triggered_price: 72000,
    cumulative_change_rate: -4.2,
    triggered_at: '2024-01-15T09:30:00Z',
    message: 'LG가 기준가 대비 4% 하락했습니다.',
    is_read: false,
  },
  {
    id: '2',
    subscription_id: '1',
    condition_id: '2',
    stock_code: '004731',
    stock_name: 'LG',
    condition_type: 'rise',
    threshold: 8.0,
    period_days: 3,
    triggered_price: 81000,
    cumulative_change_rate: 8.5,
    triggered_at: '2024-01-12T14:20:00Z',
    message: 'LG가 3일간 기준가 대비 8% 상승했습니다.',
    is_read: true,
  },
  {
    id: '3',
    subscription_id: '2',
    condition_id: '3',
    stock_code: '035420',
    stock_name: '네이버',
    condition_type: 'rise',
    threshold: 5.0,
    period_days: 1,
    triggered_price: 210000,
    cumulative_change_rate: 5.2,
    triggered_at: '2024-01-10T11:45:00Z',
    message: '네이버가 기준가 대비 5% 상승했습니다.',
    is_read: true,
  },
  {
    id: '4',
    subscription_id: '1',
    condition_id: '1',
    stock_code: '004731',
    stock_name: 'LG',
    condition_type: 'drop',
    threshold: 4.0,
    period_days: 1,
    triggered_price: 71500,
    cumulative_change_rate: -4.1,
    triggered_at: '2024-01-08T16:30:00Z',
    message: 'LG가 기준가 대비 4% 하락했습니다.',
    is_read: true,
  },
];
