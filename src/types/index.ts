// 네이버 주식 API 응답 타입 정의
export interface NaverStockApiResponse {
  stockEndType: string;
  itemCode: string;
  reutersCode: string;
  stockName: string;
  itemLogoUrl: string;
  sosok: string;
  closePrice: string;
  compareToPreviousClosePrice: string;
  compareToPreviousPrice: {
    code: string;
    text: string;
    name: string;
  };
  fluctuationsRatio: string;
  marketStatus: string;
  localTradedAt: string;
  tradeStopType: {
    code: string;
    text: string;
    name: string;
  };
  stockExchangeType: {
    code: string;
    zoneId: string;
    nationType: string;
    delayTime: number;
    startTime: string;
    endTime: string;
    closePriceSendTime: string;
    nameKor: string;
    nameEng: string;
    stockType: string;
    nationCode: string;
    nationName: string;
    name: string;
  };
  stockExchangeName: string;
  imageCharts: {
    candleWeek: string;
    areaMonthThree: string;
    day: string;
    areaYearThree: string;
    areaYear: string;
    day_up: string;
    day_up_tablet: string;
    candleMonth: string;
    areaYearTen: string;
    transparent: string;
    candleDay: string;
  };
  imageChartUrlInfo: {
    line: {
      day: string;
      month3: string;
      year: string;
      year3: string;
      year5: string;
      year10: string;
    };
    candle: {
      day: string;
      week: string;
      month: string;
    };
    mini: {
      transparent: string;
      dayUp: string;
      dayUpTablet: string;
    };
  };
  scriptChartTypes: string[];
  delayTime: number;
  delayTimeName: string;
  endUrl: string;
  chartIqEndUrl: string;
  newlyListed: boolean;
  nationType: string;
  nationName: string;
  overMarketPriceInfo?: {
    tradingSessionType: string;
    overMarketStatus: string;
    overPrice: string;
    compareToPreviousPrice: {
      code: string;
      text: string;
      name: string;
    };
    compareToPreviousClosePrice: string;
    fluctuationsRatio: string;
    localTradedAt: string;
    tradeStopType: {
      code: string;
      text: string;
      name: string;
    };
  };
}

// 주식 정보를 앱에서 사용하기 위한 정규화된 타입
export interface StockInfo {
  code: string;
  name: string;
  logoUrl: string;
  currentPrice: number;
  changeAmount: number;
  changeRate: number;
  marketStatus: 'OPEN' | 'CLOSE' | 'PRE_MARKET' | 'AFTER_MARKET';
  marketName: string;
  lastTradedAt: Date;
  isRising: boolean;
  volume?: number;
  highPrice?: number;
  lowPrice?: number;
  openPrice?: number;
}

// Supabase 데이터베이스 타입 정의
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          last_login_at: string | null;
          timezone: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          timezone?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          timezone?: string;
        };
      };
      stock_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stock_code: string;
          stock_name: string;
          market: string;
          added_at: string;
          is_active: boolean;
          base_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stock_code: string;
          stock_name: string;
          market: string;
          added_at?: string;
          is_active?: boolean;
          base_price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stock_code?: string;
          stock_name?: string;
          market?: string;
          added_at?: string;
          is_active?: boolean;
          base_price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      alert_conditions: {
        Row: {
          id: string;
          subscription_id: string;
          condition_type: 'rise' | 'drop';
          threshold: number;
          period_days: number;
          base_price: number;
          target_price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_checked_at: string | null;
          condition_met_at: string | null;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          condition_type: 'rise' | 'drop';
          threshold: number;
          period_days: number;
          base_price: number;
          target_price: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_checked_at?: string | null;
          condition_met_at?: string | null;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          condition_type?: 'rise' | 'drop';
          threshold?: number;
          period_days?: number;
          base_price?: number;
          target_price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_checked_at?: string | null;
          condition_met_at?: string | null;
        };
      };
      stock_prices: {
        Row: {
          id: string;
          stock_code: string;
          market: string;
          price: number;
          change_rate: number;
          change_amount: number;
          volume: number;
          high_price: number | null;
          low_price: number | null;
          open_price: number | null;
          close_price: number | null;
          price_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          stock_code: string;
          market: string;
          price: number;
          change_rate: number;
          change_amount: number;
          volume: number;
          high_price?: number | null;
          low_price?: number | null;
          open_price?: number | null;
          close_price?: number | null;
          price_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          stock_code?: string;
          market?: string;
          price?: number;
          change_rate?: number;
          change_amount?: number;
          volume?: number;
          high_price?: number | null;
          low_price?: number | null;
          open_price?: number | null;
          close_price?: number | null;
          price_date?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          condition_id: string;
          notification_type: 'push' | 'email' | 'sms';
          title: string;
          message: string;
          sent_at: string;
          delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
          delivery_confirmed_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          condition_id: string;
          notification_type: 'push' | 'email' | 'sms';
          title: string;
          message: string;
          sent_at?: string;
          delivery_status?: 'pending' | 'sent' | 'delivered' | 'failed';
          delivery_confirmed_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          condition_id?: string;
          notification_type?: 'push' | 'email' | 'sms';
          title?: string;
          message?: string;
          sent_at?: string;
          delivery_status?: 'pending' | 'sent' | 'delivered' | 'failed';
          delivery_confirmed_at?: string | null;
          error_message?: string | null;
        };
      };
      fcm_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          device_type: 'web' | 'android' | 'ios';
          device_info: Record<string, any> | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_used_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          device_type: 'web' | 'android' | 'ios';
          device_info?: Record<string, any> | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          device_type?: 'web' | 'android' | 'ios';
          device_info?: Record<string, any> | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          setting_key: string;
          setting_value: string;
          setting_type: 'string' | 'number' | 'boolean' | 'json';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          setting_key: string;
          setting_value: string;
          setting_type: 'string' | 'number' | 'boolean' | 'json';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          setting_key?: string;
          setting_value?: string;
          setting_type?: 'string' | 'number' | 'boolean' | 'json';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// 편의를 위한 타입 별칭
export type User = Database['public']['Tables']['users']['Row'];
export type StockSubscription = Database['public']['Tables']['stock_subscriptions']['Row'];
export type AlertCondition = Database['public']['Tables']['alert_conditions']['Row'];
export type StockPrice = Database['public']['Tables']['stock_prices']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type FcmToken = Database['public']['Tables']['fcm_tokens']['Row'];
export type AppSetting = Database['public']['Tables']['app_settings']['Row'];

// Insert 타입들
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type StockSubscriptionInsert = Database['public']['Tables']['stock_subscriptions']['Insert'];
export type AlertConditionInsert = Database['public']['Tables']['alert_conditions']['Insert'];
export type StockPriceInsert = Database['public']['Tables']['stock_prices']['Insert'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type FcmTokenInsert = Database['public']['Tables']['fcm_tokens']['Insert'];
export type AppSettingInsert = Database['public']['Tables']['app_settings']['Insert'];

// Update 타입들
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type StockSubscriptionUpdate = Database['public']['Tables']['stock_subscriptions']['Update'];
export type AlertConditionUpdate = Database['public']['Tables']['alert_conditions']['Update'];
export type StockPriceUpdate = Database['public']['Tables']['stock_prices']['Update'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];
export type FcmTokenUpdate = Database['public']['Tables']['fcm_tokens']['Update'];
export type AppSettingUpdate = Database['public']['Tables']['app_settings']['Update'];

// 주식 상세 정보 (구독 + 주가 + 조건들)
export interface StockDetail {
  subscription: StockSubscription;
  stockInfo: StockInfo;
  conditions: AlertCondition[];
}

// 폼 데이터 타입들
export interface AddStockFormData {
  stockCode: string;
  stockName: string;
}

export interface AddConditionFormData {
  type: AlertCondition['condition_type'];
  threshold: number;
  period: number;
}

// 알림 히스토리 데이터 모델 (notifications 테이블과 연동)
export interface AlertHistory {
  id: string;
  subscription_id: string;
  condition_id: string;
  stock_code: string;
  stock_name: string;
  condition_type: AlertCondition['condition_type'];
  threshold: number;
  period_days: number;
  base_price: number;
  triggered_price: number;
  triggered_at: string;
  message: string;
  is_read: boolean;
}

// API 유틸리티 함수를 위한 타입
export interface StockApiService {
  getStockInfo: (stockCode: string) => Promise<StockInfo>;
  normalizeStockData: (apiResponse: NaverStockApiResponse) => StockInfo;
}

// 상수 정의
export const STOCK_CODE_REGEX = /^\d{6}$/; // 6자리 숫자
export const MAX_CONDITIONS_PER_STOCK = 5;
export const DEFAULT_REFRESH_TIME = 18; // 오후 6시
export const MIN_THRESHOLD = 0.1; // 최소 0.1%
export const MAX_THRESHOLD = 100; // 최대 100%
export const MIN_PERIOD = 1; // 최소 1일
export const MAX_PERIOD = 30; // 최대 30일

// 조건 타입 매핑
export const CONDITION_TYPE_LABELS = {
  rise: '상승',
  drop: '하락',
} as const;

// 시장 상태 매핑
export const MARKET_STATUS_LABELS = {
  OPEN: '거래중',
  CLOSE: '거래종료',
  PRE_MARKET: '장전',
  AFTER_MARKET: '장후',
} as const;
