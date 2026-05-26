// 탭 3: 고객 분석 — 세그먼트, Top 고객, 파레토, KS/ISO 인증 분석
import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Line,
} from 'recharts';
import { formatKRW, formatNumber, tooltipStyle, CHART_COLORS } from '../utils/format';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

const MEMBER_COLORS: Record<string, string> = {
  '비회원': '#6366f1',
  '소기업': '#10b981',
  '중소기업': '#f59e0b',
  '대기업': '#f43f5e',
  '단체': '#8b5cf6',
};

export function CustomerTab({ data }: Props) {
  const { customerAnalysis, memberTypes, authAnalysis } = data;
  const { customers, pareto } = customerAnalysis;

  // 회원유형별 연도 추이 (Stacked Area용)
  const memberYearlyTrend = useMemo(() => {
    // 모든 연도 수집
    const allYears = new Set<number>();
    for (const mt of memberTypes) {
      for (const y of mt.yearly) {
        allYears.add(y.year);
      }
    }

    return Array.from(allYears)
      .sort()
      .map((year) => {
        const row: Record<string, number | string> = { year: `${year}` };
        for (const mt of memberTypes) {
          const yearData = mt.yearly.find((y: { year: number }) => y.year === year);
          row[mt.name] = yearData ? yearData.revenue : 0;
        }
        return row;
      });
  }, [memberTypes]);

  // 파레토 차트 데이터 (Top 20 고객, 누적 %)
  const paretoData = customers.slice(0, 20);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ===== 상단 2열: 세그먼트 + 파레토 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 회원유형별 매출 비중 (도넛) */}
        <div className="card">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            👥 회원유형별 매출 비중
          </h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={280}>
              <PieChart>
                <Pie
                  data={memberTypes}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {memberTypes.map((mt: { name: string }, i: number) => (
                    <Cell key={mt.name} fill={MEMBER_COLORS[mt.name] || CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value: any, name: any) => [formatKRW(value, false), name]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* 범례 + 통계 */}
            <div className="flex-1 space-y-3">
              {memberTypes.map((mt: { name: string; revenue: number; count: number; percent: number; avgPerTransaction: number }) => (
                <div key={mt.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: MEMBER_COLORS[mt.name] || '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {mt.name}
                      </span>
                      <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {mt.percent}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      <span>{formatKRW(mt.revenue)}</span>
                      <span>{formatNumber(mt.count)}건</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 파레토 분석 */}
        <div className="card">
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            📊 파레토 분석 (고객 집중도)
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            상위 {pareto.top20PercentCustomers}개 고객 ({((pareto.top20PercentCustomers / pareto.totalCustomers) * 100).toFixed(0)}%)이 
            전체 매출의 <span className="text-amber-400 font-bold">{pareto.top20RevenuePercent}%</span>를 차지
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChartWrapper data={paretoData} />
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== 회원유형별 연도 추이 ===== */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          📈 회원유형별 연도 추이
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={memberYearlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v: number) => formatKRW(v)}
              width={60}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: any, name: any) => [formatKRW(value, false), name]}
            />
            {memberTypes.map((mt: { name: string }, i: number) => (
              <Area
                key={mt.name}
                type="monotone"
                dataKey={mt.name}
                stackId="1"
                stroke={MEMBER_COLORS[mt.name] || CHART_COLORS[i]}
                fill={MEMBER_COLORS[mt.name] || CHART_COLORS[i]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ===== 하단: Top 고객 + KS/ISO ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 고객 테이블 */}
        <div className="card lg:col-span-2">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            🏆 매출 Top 20 고객사
          </h3>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>고객명</th>
                  <th className="text-right">매출 합계</th>
                  <th className="text-right">건수</th>
                  <th className="text-right">건당 평균</th>
                  <th>유형</th>
                  <th className="text-right">누적 %</th>
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, 20).map((c: { rank: number; name: string; revenue: number; count: number; avgPerTransaction: number; memberType: string; cumulativePercent: number }) => (
                  <tr key={c.rank}>
                    <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{c.rank}</td>
                    <td className="font-medium max-w-[200px] truncate">{c.name}</td>
                    <td className="text-right font-mono">{formatKRW(c.revenue)}</td>
                    <td className="text-right font-mono">{c.count}</td>
                    <td className="text-right font-mono">{formatKRW(c.avgPerTransaction)}</td>
                    <td>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${MEMBER_COLORS[c.memberType] || '#6366f1'}20`,
                          color: MEMBER_COLORS[c.memberType] || '#6366f1',
                        }}
                      >
                        {c.memberType}
                      </span>
                    </td>
                    <td className="text-right font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {c.cumulativePercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KS/ISO 인증 분석 */}
        <div className="card">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            🏅 인증 현황 분석
          </h3>

          {/* KS 인증 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>KS인증</h4>
            {authAnalysis.ks.map((item: { status: string; revenue: number; count: number }) => (
              <div key={item.status} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    item.status === 'O' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {item.status === 'O' ? '인증 보유' : '미보유'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                    {formatKRW(item.revenue)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatNumber(item.count)}건
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ISO 인증 */}
          <div>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>ISO인증</h4>
            {authAnalysis.iso.map((item: { status: string; revenue: number; count: number }) => (
              <div key={item.status} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    item.status === 'O' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {item.status === 'O' ? '인증 보유' : '미보유'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                    {formatKRW(item.revenue)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatNumber(item.count)}건
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 파레토 차트 래퍼 (ComposedChart를 별도로)
import { ComposedChart } from 'recharts';

function ComposedChartWrapper({ data }: { data: Array<{ rank: number; name: string; revenue: number; cumulativePercent: number }> }) {
  return (
    <ComposedChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
      <XAxis
        dataKey="name"
        tick={{ fill: '#64748b', fontSize: 9 }}
        angle={-45}
        textAnchor="end"
        height={80}
        interval={0}
        tickFormatter={(v: string) => v.length > 6 ? v.slice(0, 6) + '…' : v}
      />
      <YAxis
        yAxisId="left"
        tick={{ fill: '#64748b', fontSize: 11 }}
        tickFormatter={(v: number) => formatKRW(v)}
        width={60}
      />
      <YAxis
        yAxisId="right"
        orientation="right"
        tick={{ fill: '#f59e0b', fontSize: 11 }}
        tickFormatter={(v: number) => `${v}%`}
        domain={[0, 100]}
        width={50}
      />
      <Tooltip
        {...tooltipStyle}
        formatter={(value: any, name: any) => [
          name === 'revenue' ? formatKRW(value, false) : `${value}%`,
          name === 'revenue' ? '매출' : '누적 비중',
        ]}
      />
      <Bar yAxisId="left" dataKey="revenue" fill="#6366f1" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
      <Line yAxisId="right" dataKey="cumulativePercent" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} type="monotone" />
    </ComposedChart>
  );
}
