import { StockSubscription, AlertCondition, StockPrice, StockDetail, AlertHistory } from '@/types';

// Mock 데이터 - 실제 API 연동 없이 개발용 데이터
export const MOCK_STOCK_SUBSCRIPTIONS: StockSubscription[] = [
  {
    id: '1',
    userId: 'user1',
    stockCode: '005930',
    stockName: '삼성전자',
    addedAt: new Date('2024-01-01'),
    isActive: true,
  },
  {
    id: '2',
    userId: 'user1',
    stockCode: '035420',
    stockName: '네이버',
    addedAt: new Date('2024-01-02'),
    isActive: true,
  },
  {
    id: '3',
    userId: 'user1',
    stockCode: '000660',
    stockName: 'SK하이닉스',
    addedAt: new Date('2024-01-03'),
    isActive: true,
  },
];

export const MOCK_ALERT_CONDITIONS: AlertCondition[] = [
  {
    id: '1',
    subscriptionId: '1',
    type: 'drop',
    threshold: 4.0,
    period: 1,
    basePrice: 75000,
    createdAt: new Date('2024-01-01'),
    isActive: true,
  },
  {
    id: '2',
    subscriptionId: '1',
    type: 'rise',
    threshold: 8.0,
    period: 3,
    basePrice: 75000,
    createdAt: new Date('2024-01-01'),
    isActive: true,
  },
  {
    id: '3',
    subscriptionId: '2',
    type: 'rise',
    threshold: 5.0,
    period: 1,
    basePrice: 200000,
    createdAt: new Date('2024-01-02'),
    isActive: true,
  },
];

export const MOCK_STOCK_PRICES: StockPrice[] = [
  {
    stockCode: '005930',
    currentPrice: 72000,
    changeRate: -4.0,
    changeAmount: -3000,
    volume: 1000000,
    timestamp: new Date(),
  },
  {
    stockCode: '035420',
    currentPrice: 210000,
    changeRate: 5.0,
    changeAmount: 10000,
    volume: 500000,
    timestamp: new Date(),
  },
  {
    stockCode: '000660',
    currentPrice: 120000,
    changeRate: 2.5,
    changeAmount: 3000,
    volume: 800000,
    timestamp: new Date(),
  },
];

// Mock 데이터를 조합하여 StockDetail 생성
export const MOCK_STOCK_DETAILS: StockDetail[] = MOCK_STOCK_SUBSCRIPTIONS.map(subscription => {
  const price = MOCK_STOCK_PRICES.find(p => p.stockCode === subscription.stockCode);
  const conditions = MOCK_ALERT_CONDITIONS.filter(c => c.subscriptionId === subscription.id);
  
  return {
    subscription,
    price: price || {
      stockCode: subscription.stockCode,
      currentPrice: 0,
      changeRate: 0,
      changeAmount: 0,
      volume: 0,
      timestamp: new Date(),
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
    subscriptionId: '1',
    conditionId: '1',
    stockCode: '005930',
    stockName: '삼성전자',
    conditionType: 'drop',
    threshold: 4.0,
    period: 1,
    basePrice: 75000,
    triggeredPrice: 72000,
    triggeredAt: new Date('2024-01-15T09:30:00'),
    message: '삼성전자가 기준가 대비 4% 하락했습니다.',
    isRead: false,
  },
  {
    id: '2',
    subscriptionId: '1',
    conditionId: '2',
    stockCode: '005930',
    stockName: '삼성전자',
    conditionType: 'rise',
    threshold: 8.0,
    period: 3,
    basePrice: 75000,
    triggeredPrice: 81000,
    triggeredAt: new Date('2024-01-12T14:20:00'),
    message: '삼성전자가 3일간 기준가 대비 8% 상승했습니다.',
    isRead: true,
  },
  {
    id: '3',
    subscriptionId: '2',
    conditionId: '3',
    stockCode: '035420',
    stockName: '네이버',
    conditionType: 'rise',
    threshold: 5.0,
    period: 1,
    basePrice: 200000,
    triggeredPrice: 210000,
    triggeredAt: new Date('2024-01-10T11:45:00'),
    message: '네이버가 기준가 대비 5% 상승했습니다.',
    isRead: true,
  },
  {
    id: '4',
    subscriptionId: '1',
    conditionId: '1',
    stockCode: '005930',
    stockName: '삼성전자',
    conditionType: 'drop',
    threshold: 4.0,
    period: 1,
    basePrice: 75000,
    triggeredPrice: 71500,
    triggeredAt: new Date('2024-01-08T16:30:00'),
    message: '삼성전자가 기준가 대비 4% 하락했습니다.',
    isRead: true,
  },
];
