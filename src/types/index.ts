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
}

// Supabase 데이터베이스 타입 정의 (자동 생성)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert_conditions: {
        Row: {
          condition_type: string
          created_at: string | null
          cumulative_change_rate: number
          id: string
          is_active: boolean | null
          last_checked_at: string | null
          period_days: number
          subscription_id: string
          threshold: number
          tracking_ended_at: string | null
          tracking_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          condition_type: string
          created_at?: string | null
          cumulative_change_rate?: number
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          period_days?: number
          subscription_id: string
          threshold: number
          tracking_ended_at?: string | null
          tracking_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          condition_type?: string
          created_at?: string | null
          cumulative_change_rate?: number
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          period_days?: number
          subscription_id?: string
          threshold?: number
          tracking_ended_at?: string | null
          tracking_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_conditions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "stock_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      fcm_tokens: {
        Row: {
          created_at: string | null
          device_info: Json | null
          device_type: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          device_type: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fcm_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          condition_id: string
          created_at: string | null
          cumulative_change_rate: number
          delivery_confirmed_at: boolean | null
          id: string
          sent_at: string | null
          subscription_id: string
          triggered_price: number
          user_id: string
        }
        Insert: {
          condition_id: string
          created_at?: string | null
          cumulative_change_rate?: number
          delivery_confirmed_at?: boolean | null
          id?: string
          sent_at?: string | null
          subscription_id: string
          triggered_price: number
          user_id: string
        }
        Update: {
          condition_id?: string
          created_at?: string | null
          cumulative_change_rate?: number
          delivery_confirmed_at?: boolean | null
          id?: string
          sent_at?: string | null
          subscription_id?: string
          triggered_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "alert_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "stock_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_subscriptions: {
        Row: {
          api_info: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          market: string
          nation_type: string
          stock_code: string
          stock_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          market?: string
          nation_type?: string
          stock_code: string
          stock_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          market?: string
          nation_type?: string
          stock_code?: string
          stock_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          name: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 편의를 위한 타입 별칭
export type User = Database['public']['Tables']['users']['Row'];
export type StockSubscription = Database['public']['Tables']['stock_subscriptions']['Row'];
export type AlertCondition = Database['public']['Tables']['alert_conditions']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type FcmToken = Database['public']['Tables']['fcm_tokens']['Row'];

// Insert 타입들
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type StockSubscriptionInsert = Database['public']['Tables']['stock_subscriptions']['Insert'];
export type AlertConditionInsert = Database['public']['Tables']['alert_conditions']['Insert'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type FcmTokenInsert = Database['public']['Tables']['fcm_tokens']['Insert'];

// Update 타입들
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type StockSubscriptionUpdate = Database['public']['Tables']['stock_subscriptions']['Update'];
export type AlertConditionUpdate = Database['public']['Tables']['alert_conditions']['Update'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];
export type FcmTokenUpdate = Database['public']['Tables']['fcm_tokens']['Update'];

// 주식 상세 정보 (구독 + 주가 + 조건들)
export interface StockDetail {
  subscription: StockSubscription;
  stockInfo: StockInfo;
  conditions: AlertConditionWithStatus[];
}

// 조건 충족 상태가 포함된 AlertCondition
export interface AlertConditionWithStatus extends AlertCondition {
  is_condition_met?: boolean; // 백엔드에서 계산된 조건 충족 상태
}

// 폼 데이터 타입들
export interface AddStockFormData {
  stockCode: string;
  stockName: string;
}

export interface AddConditionFormData {
  type: 'rise' | 'drop';
  threshold: string;
  period: string;
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
  triggered_price: number;
  cumulative_change_rate: number;
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

// 모니터링 관련 상수 (PRD에 명시된 시간)
export const KOREAN_MARKET_CHECK_TIME = "09:00"; // 국내 주식 모니터링 시간 (KST)
export const FOREIGN_MARKET_CHECK_TIME = "23:00"; // 해외 주식 모니터링 시간 (KST)
export const MONITORING_TIMEZONE = "Asia/Seoul"; // 모니터링 기준 시간대

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
