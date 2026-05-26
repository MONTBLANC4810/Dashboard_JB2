// 매출 대시보드 공통 유틸리티 함수

/**
 * 숫자를 한국식 금액 표기로 변환
 * 예: 4234684118 → "42.3억"
 */
export function formatKRW(value: number, compact = true): string {
  if (!value && value !== 0) return '-';
  
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (!compact) {
    return sign + abs.toLocaleString('ko-KR') + '원';
  }
  
  if (abs >= 1_0000_0000) {
    // 억 단위
    const billions = abs / 1_0000_0000;
    return sign + billions.toFixed(1) + '억';
  } else if (abs >= 1_0000) {
    // 만 단위
    const tenThousands = abs / 1_0000;
    return sign + tenThousands.toFixed(0) + '만';
  } else {
    return sign + abs.toLocaleString('ko-KR');
  }
}

/**
 * 숫자를 천 단위 콤마 포맷
 */
export function formatNumber(value: number): string {
  if (!value && value !== 0) return '-';
  return value.toLocaleString('ko-KR');
}

/**
 * 퍼센트 포맷
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const sign = value > 0 ? '+' : '';
  return sign + value.toFixed(1) + '%';
}

/**
 * YoY 변화에 따른 색상 반환
 */
export function getChangeColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'text-slate-400';
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-rose-400';
  return 'text-slate-400';
}

/**
 * 차트 색상 팔레트
 */
export const CHART_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16', // lime
  '#a855f7', // purple
  '#0ea5e9', // sky
];

/**
 * 연도별 색상
 */
export const YEAR_COLORS: Record<number, string> = {
  2021: '#6366f1',
  2022: '#10b981',
  2023: '#f59e0b',
  2024: '#f43f5e',
  2025: '#8b5cf6',
  2026: '#06b6d4',
};

/**
 * 커스텀 툴팁 스타일
 */
export const tooltipStyle = {
  contentStyle: {
    background: 'rgba(30, 34, 53, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
    fontSize: '13px',
    color: '#f1f5f9',
  },
  labelStyle: {
    color: '#94a3b8',
    fontWeight: 600,
    marginBottom: '6px',
  },
  itemStyle: {
    color: '#f1f5f9',
    padding: '2px 0',
  },
};
