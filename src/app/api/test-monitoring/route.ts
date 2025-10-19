import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

// 서버 사이드 Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * 테스트 모니터링 API
 * 현재 구현된 주식 모니터링 기능을 테스트합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      testType = 'all', // 'all', 'subscriptions', 'conditions', 'prices'
      userId = null,
      stockCode = null
    } = body;

    const results: any = {
      timestamp: new Date().toISOString(),
      testType,
      results: {}
    };

    // 1. 주식 구독 테스트
    if (testType === 'all' || testType === 'subscriptions') {
      try {
        let query = supabase
          .from('stock_subscriptions')
          .select(`
            id,
            user_id,
            stock_code,
            stock_name,
            market,
            is_active,
            created_at,
            updated_at
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data: subscriptions, error: subError } = await query;

        if (subError) {
          results.results.subscriptions = {
            success: false,
            error: subError.message,
            count: 0
          };
        } else {
          results.results.subscriptions = {
            success: true,
            data: subscriptions,
            count: subscriptions?.length || 0
          };
        }
      } catch (error) {
        results.results.subscriptions = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          count: 0
        };
      }
    }

    // 2. 알림 조건 테스트
    if (testType === 'all' || testType === 'conditions') {
      try {
        let query = supabase
          .from('alert_conditions')
          .select(`
            id,
            subscription_id,
            condition_type,
            threshold,
            period_days,
            is_active,
            created_at,
            updated_at,
            last_checked_at,
            tracking_started_at,
            tracking_ended_at,
            stock_subscriptions!inner(
              stock_code,
              stock_name,
              market,
              user_id
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.eq('stock_subscriptions.user_id', userId);
        }

        if (stockCode) {
          query = query.eq('stock_subscriptions.stock_code', stockCode);
        }

        const { data: conditions, error: condError } = await query;

        if (condError) {
          results.results.conditions = {
            success: false,
            error: condError.message,
            count: 0
          };
        } else {
          results.results.conditions = {
            success: true,
            data: conditions,
            count: conditions?.length || 0
          };
        }
      } catch (error) {
        results.results.conditions = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          count: 0
        };
      }
    }

    // 3. 주가 데이터 테스트
    if (testType === 'all' || testType === 'prices') {
      try {
        // 활성화된 주식 구독들의 주가 조회
        const { data: subscriptions } = await supabase
          .from('stock_subscriptions')
          .select('stock_code, stock_name, market')
          .eq('is_active', true);

        if (!subscriptions || subscriptions.length === 0) {
          results.results.prices = {
            success: true,
            message: '활성화된 주식 구독이 없습니다.',
            data: [],
            count: 0
          };
        } else {
          const priceResults = [];
          
          for (const subscription of subscriptions.slice(0, 5)) { // 최대 5개만 테스트
            try {
              const response = await fetch(
                `https://polling.finance.naver.com/api/realtime/domestic/stock/${subscription.stock_code}`,
                {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                  }
                }
              );

              if (response.ok) {
                const data = await response.json();
                priceResults.push({
                  stock_code: subscription.stock_code,
                  stock_name: subscription.stock_name,
                  success: true,
                  data: {
                    currentPrice: data.currentPrice,
                    fluctuationsRatio: data.fluctuationsRatio,
                    marketStatus: data.marketStatus
                  }
                });
              } else {
                priceResults.push({
                  stock_code: subscription.stock_code,
                  stock_name: subscription.stock_name,
                  success: false,
                  error: `HTTP ${response.status}`
                });
              }
            } catch (error) {
              priceResults.push({
                stock_code: subscription.stock_code,
                stock_name: subscription.stock_name,
                success: false,
                error: error instanceof Error ? error.message : String(error)
              });
            }
          }

          results.results.prices = {
            success: true,
            data: priceResults,
            count: priceResults.length
          };
        }
      } catch (error) {
        results.results.prices = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          count: 0
        };
      }
    }

    // 4. 조건 충족 테스트 (시뮬레이션)
    if (testType === 'all' || testType === 'conditions') {
      try {
        const { data: conditions } = await supabase
          .from('alert_conditions')
          .select(`
            id,
            condition_type,
            threshold,
            period_days,
            tracking_started_at,
            tracking_ended_at,
            stock_subscriptions!inner(
              stock_code,
              stock_name,
              market
            )
          `)
          .eq('is_active', true);

        if (conditions && conditions.length > 0) {
          const simulationResults = conditions.map(condition => {
            // 시뮬레이션용 가격 데이터 (실제로는 API에서 가져와야 함)
            const mockPrice = 50000 + Math.random() * 10000;
            const mockChangeRate = (Math.random() - 0.5) * 10; // -5% ~ +5%

            let conditionMet = false;
            if (condition.condition_type === 'rise' && mockChangeRate > condition.threshold) {
              conditionMet = true;
            } else if (condition.condition_type === 'drop' && mockChangeRate < -condition.threshold) {
              conditionMet = true;
            }

            return {
              condition_id: condition.id,
              stock_code: condition.stock_subscriptions.stock_code,
              stock_name: condition.stock_subscriptions.stock_name,
              condition_type: condition.condition_type,
              threshold: condition.threshold,
              mock_price: mockPrice,
              mock_change_rate: mockChangeRate,
              condition_met: conditionMet,
              tracking_period: {
                started: condition.tracking_started_at,
                ended: condition.tracking_ended_at
              }
            };
          });

          results.results.conditionSimulation = {
            success: true,
            data: simulationResults,
            count: simulationResults.length,
            note: '이것은 시뮬레이션 데이터입니다. 실제 주가 데이터와 다를 수 있습니다.'
          };
        } else {
          results.results.conditionSimulation = {
            success: true,
            message: '활성화된 알림 조건이 없습니다.',
            data: [],
            count: 0
          };
        }
      } catch (error) {
        results.results.conditionSimulation = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          count: 0
        };
      }
    }

    // 전체 결과 요약
    const totalTests = Object.keys(results.results).length;
    const successfulTests = Object.values(results.results).filter((result: any) => result.success).length;
    
    results.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      successRate: totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0
    };

    return NextResponse.json({
      success: true,
      message: '테스트 모니터링이 완료되었습니다.',
      results
    });

  } catch (error) {
    console.error('테스트 모니터링 API 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '테스트 모니터링 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 테스트 모니터링 상태 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // 기본 통계 조회
    const stats: any = {
      timestamp: new Date().toISOString(),
      database: {
        subscriptions: { total: 0, active: 0 },
        conditions: { total: 0, active: 0 },
        users: { total: 0 }
      }
    };

    // 주식 구독 통계
    let subQuery = supabase
      .from('stock_subscriptions')
      .select('id, is_active', { count: 'exact', head: true });

    if (userId) {
      subQuery = subQuery.eq('user_id', userId);
    }

    const { count: totalSubs } = await subQuery;
    stats.database.subscriptions.total = totalSubs || 0;

    const { count: activeSubs } = await supabase
      .from('stock_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    stats.database.subscriptions.active = activeSubs || 0;

    // 알림 조건 통계
    let condQuery = supabase
      .from('alert_conditions')
      .select('id, is_active', { count: 'exact', head: true });

    if (userId) {
      condQuery = condQuery.eq('stock_subscriptions.user_id', userId);
    }

    const { count: totalConds } = await condQuery;
    stats.database.conditions.total = totalConds || 0;

    const { count: activeConds } = await supabase
      .from('alert_conditions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    stats.database.conditions.active = activeConds || 0;

    // 사용자 통계 (Supabase Auth 사용)
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      stats.database.users.total = authData?.users?.length || 0;
    } catch (error) {
      console.warn('사용자 통계 조회 실패:', error);
      stats.database.users.total = 0;
    }

    return NextResponse.json({
      success: true,
      message: '테스트 모니터링 상태를 조회했습니다.',
      stats
    });

  } catch (error) {
    console.error('테스트 모니터링 상태 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '테스트 모니터링 상태 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
