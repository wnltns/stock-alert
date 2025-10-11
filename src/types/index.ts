// 주식 구독 데이터 모델
export interface StockSubscription {
  id: string;
  userId: string;
  stockCode: string;        // 예: "005930" (삼성전자)
  stockName: string;        // 예: "삼성전자"
  addedAt: Date;
  isActive: boolean;
}

// 알림 조건 데이터 모델
export interface AlertCondition {
  id: string;
  subscriptionId: string;
  type: 'drop' | 'rise';
  threshold: number;        // 퍼센트 값 (예: 4.0 = 4%)
  period: number;          // 일수 (예: 3 = 3일)
  basePrice: number;       // 기준 가격
  createdAt: Date;
  isActive: boolean;
}

// 주가 데이터 모델
export interface StockPrice {
  stockCode: string;
  currentPrice: number;
  changeRate: number;      // 퍼센트 변화율
  changeAmount: number;    // 절대 변화량
  volume: number;          // 거래량
  timestamp: Date;
}

// 주식 상세 정보 (구독 + 주가 + 조건들)
export interface StockDetail {
  subscription: StockSubscription;
  price: StockPrice;
  conditions: AlertCondition[];
}

// 폼 데이터 타입들
export interface AddStockFormData {
  stockCode: string;
  stockName: string;
}

export interface AddConditionFormData {
  type: AlertCondition['type'];
  threshold: number;
  period: number;
}

// 알림 히스토리 데이터 모델
export interface AlertHistory {
  id: string;
  subscriptionId: string;
  conditionId: string;
  stockCode: string;
  stockName: string;
  conditionType: AlertCondition['type'];
  threshold: number;
  period: number;
  basePrice: number;
  triggeredPrice: number;
  triggeredAt: Date;
  message: string;
  isRead: boolean;
}
