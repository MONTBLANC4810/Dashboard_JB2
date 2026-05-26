// 탭 1: 매출 오버뷰 — KPI + 월별 추이 + 연도별 비교 + 최근 거래
import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Hash, Calendar, ArrowUpRight } from 'lucide-react';
import { formatKRW, formatNumber, formatPercent, getChangeColor, tooltipStyle, YEAR_COLORS } from '../utils/format';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export function OverviewTab({ data }: Props) {
  const { summary, monthly, yearly } = data;

  // 최근연도와 전년 비교
  const currentYear = yearly[yearly.length - 1];
  const prevYear = yearly.length >= 2 ? yearly[yearly.length - 2] : null;

  // 올해 월평균
  const currentYearAvg = currentYear
    ? Math.round(currentYear.revenue / (currentYear.monthCount || 1))
    : 0;

  // 12개월 이동평균 계산
  const monthlyWithMA = useMemo(() => {
    return monthly.map((m: { yearMonth: string; revenue: number; count: number }, i: number) => {
      const windowSize = Math.min(12, i + 1);
      const window = monthly.slice(i - windowSize + 1, i + 1);
      const ma = window.reduce((s: number, w: { revenue: number }) => s + w.revenue, 0) / windowSize;
      return { ...m, ma: Math.round(ma) };
    });
  }, [monthly]);

  // 연도별 월 비교 (같은 월끼리)
  const yearlyMonthCompare = useMemo(() => {
    const result: Array<Record<string, number | string>> = [];
    for (let m = 1; m <= 12; m++) {
      const row: Record<string, number | string> = { month: `${m}월` };
      for (const ym of monthly as Array<{ yearMonth: string; year: number; month: number; revenue: number }>) {
        if (ym.month === m) {
          row[`y${ym.year}`] = ym.revenue;
        }
      }
      result.push(row);
    }
    return result;
  }, [monthly]);

  // 사용 가능한 연도 목록
  const years = yearly.map((y: { year: number }) => y.year);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ===== KPI 카드 ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 총 매출 */}
        <div className="kpi-card blue animate-fade-in animate-fade-in-delay-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20">
              <DollarSign size={16} className="text-indigo-400" />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>총 누적매출</span>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {formatKRW(summary.totalRevenue)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {formatKRW(summary.totalRevenue, false)}
          </div>
        </div>

        {/* 최근 연도 매출 */}
        <div className="kpi-card green animate-fade-in animate-fade-in-delay-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20">
              {prevYear && currentYear?.yoy !== null ? (
                currentYear.yoy >= 0 
                  ? <TrendingUp size={16} className="text-emerald-400" />
                  : <TrendingDown size={16} className="text-rose-400" />
              ) : (
                <ArrowUpRight size={16} className="text-emerald-400" />
              )}
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {prevYear ? `${prevYear.year}년 매출` : '올해 매출'}
            </span>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {prevYear ? formatKRW(prevYear.revenue) : formatKRW(currentYear?.revenue || 0)}
          </div>
          {prevYear?.yoy !== null && prevYear?.yoy !== undefined && (
            <div className={`text-xs font-medium ${getChangeColor(prevYear.yoy)}`}>
              전년 대비 {formatPercent(prevYear.yoy)}
            </div>
          )}
        </div>

        {/* 총 거래건수 */}
        <div className="kpi-card amber animate-fade-in animate-fade-in-delay-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/20">
              <Hash size={16} className="text-amber-400" />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>총 거래건수</span>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {formatNumber(summary.totalCount)}건
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            취소/반품 {formatNumber(summary.negativeCount)}건 포함
          </div>
        </div>

        {/* 건당 평균 */}
        <div className="kpi-card rose animate-fade-in animate-fade-in-delay-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/20">
              <DollarSign size={16} className="text-rose-400" />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>건당 평균매출</span>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {formatKRW(summary.avgAmount)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            최대 {formatKRW(summary.maxAmount)}
          </div>
        </div>

        {/* 월평균 (최근 연도) */}
        <div className="kpi-card violet animate-fade-in animate-fade-in-delay-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/20">
              <Calendar size={16} className="text-violet-400" />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {currentYear ? `${currentYear.year}년 월평균` : '월평균'}
            </span>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {formatKRW(currentYearAvg)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {currentYear?.monthCount || 0}개월 기준
          </div>
        </div>
      </div>

      {/* ===== 월별 매출 추이 ===== */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          📊 월별 매출 추이 (12개월 이동평균)
        </h3>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={monthlyWithMA}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="yearMonth"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: string) => {
                const parts = v.split('-');
                return parts[1] === '01' ? parts[0] : parts[1] + '월';
              }}
              interval={2}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v: number) => formatKRW(v)}
              width={60}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: any, name: any) => [
                formatKRW(value, false),
                name === 'revenue' ? '월 매출' : '12M 이동평균',
              ]}
            />
            <Bar dataKey="revenue" fill="#6366f1" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
            <Line
              dataKey="ma"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={false}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ===== 하단 2열 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 연도별 매출 비교 */}
        <div className="card">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            📈 연도별 매출 총액
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v: number) => formatKRW(v)}
                width={60}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: any) => [formatKRW(value, false), '매출']}
              />
              <Bar
                dataKey="revenue"
                radius={[8, 8, 0, 0]}
                fill="#6366f1"
              >
                {yearly.map((entry: { year: number }, index: number) => (
                  <rect key={index} fill={YEAR_COLORS[entry.year] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* 연도별 테이블 */}
          <div className="mt-4 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>연도</th>
                  <th className="text-right">매출</th>
                  <th className="text-right">건수</th>
                  <th className="text-right">건당 평균</th>
                  <th className="text-right">YoY</th>
                </tr>
              </thead>
              <tbody>
                {yearly.map((y: { year: number; revenue: number; count: number; avgPerTransaction: number; yoy: number | null }) => (
                  <tr key={y.year}>
                    <td className="font-medium">{y.year}년</td>
                    <td className="text-right font-mono">{formatKRW(y.revenue)}</td>
                    <td className="text-right font-mono">{formatNumber(y.count)}</td>
                    <td className="text-right font-mono">{formatKRW(y.avgPerTransaction)}</td>
                    <td className={`text-right font-mono font-medium ${getChangeColor(y.yoy)}`}>
                      {y.yoy !== null ? formatPercent(y.yoy) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 연도별 월 비교 */}
        <div className="card">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            🔄 연도별 월 비교
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyMonthCompare}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v: number) => formatKRW(v)}
                width={60}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: any, name: any) => [
                  formatKRW(value, false),
                  name.replace('y', '') + '년',
                ]}
              />
              {years.map((year: number) => (
                <Line
                  key={year}
                  dataKey={`y${year}`}
                  stroke={YEAR_COLORS[year] || '#6366f1'}
                  strokeWidth={year === years[years.length - 1] ? 3 : 1.5}
                  strokeOpacity={year === years[years.length - 1] ? 1 : 0.6}
                  dot={false}
                  type="monotone"
                  name={`y${year}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {/* 범례 */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {years.map((year: number) => (
              <div key={year} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: YEAR_COLORS[year] || '#6366f1' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
