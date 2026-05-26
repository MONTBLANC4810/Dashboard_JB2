// 탭 4: 사업유형(예산목) 분석 — 순위, 계절성, 연도 추이
import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
} from 'recharts';
import { formatKRW, formatNumber, tooltipStyle, CHART_COLORS, YEAR_COLORS } from '../utils/format';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export function ProductTab({ data }: Props) {
  const { budgetTypes } = data;
  const [selectedType, setSelectedType] = useState<string>(budgetTypes[0]?.name || '');

  // Top 10 사업유형
  const top10 = budgetTypes.slice(0, 10);

  // 선택된 사업유형의 계절성 데이터
  const seasonality = useMemo(() => {
    const bt = budgetTypes.find((b: { name: string }) => b.name === selectedType);
    if (!bt) return [];
    return bt.seasonality.map((s: { month: number; avgRevenue: number }) => ({
      ...s,
      monthLabel: `${s.month}월`,
    }));
  }, [budgetTypes, selectedType]);

  // 선택된 사업유형의 연도별 추이
  const yearlyTrend = useMemo(() => {
    const bt = budgetTypes.find((b: { name: string }) => b.name === selectedType);
    if (!bt) return [];
    return bt.yearly;
  }, [budgetTypes, selectedType]);

  // 상위 5개 사업유형의 연도별 추이 (Stacked Area)
  const top5YearlyTrend = useMemo(() => {
    const top5 = budgetTypes.slice(0, 5);
    const allYears = new Set<number>();
    for (const bt of top5) {
      for (const y of bt.yearly) {
        allYears.add(y.year);
      }
    }

    return Array.from(allYears)
      .sort()
      .map((year) => {
        const row: Record<string, number | string> = { year: `${year}` };
        for (const bt of top5) {
          const yearData = bt.yearly.find((y: { year: number }) => y.year === year);
          row[bt.name] = yearData ? yearData.revenue : 0;
        }
        return row;
      });
  }, [budgetTypes]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ===== 사업유형 매출 순위 ===== */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          📦 사업유형(예산목)별 매출 순위 (Top 10)
        </h3>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={top10} layout="vertical" margin={{ left: 130 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v: number) => formatKRW(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              width={130}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: any) => [formatKRW(value, false), '매출']}
            />
            <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
              {top10.map((_: unknown, i: number) => (
                <rect key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== 중간 2열: 계절성 + 연도별 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 선택한 사업유형의 계절성 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              📅 계절성 패턴 (월별 평균)
            </h3>
          </div>
          {/* 사업유형 선택 */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full mb-4 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            {budgetTypes.map((bt: { name: string }) => (
              <option key={bt.name} value={bt.name}>{bt.name}</option>
            ))}
          </select>

          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={seasonality}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="monthLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v: number) => formatKRW(v)} />
              <Radar
                dataKey="avgRevenue"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: any) => [formatKRW(value, false), '월 평균']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 선택한 사업유형의 연도별 추이 */}
        <div className="card">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            📈 「{selectedType}」 연도별 추이
          </h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={yearlyTrend}>
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
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                {yearlyTrend.map((entry: { year: number }, i: number) => (
                  <rect key={i} fill={YEAR_COLORS[entry.year] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Top 5 사업유형 연도 추이 (Stacked) ===== */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          📊 Top 5 사업유형 연도별 추이
        </h3>
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={top5YearlyTrend}>
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
            {budgetTypes.slice(0, 5).map((bt: { name: string }, i: number) => (
              <Area
                key={bt.name}
                type="monotone"
                dataKey={bt.name}
                stackId="1"
                stroke={CHART_COLORS[i]}
                fill={CHART_COLORS[i]}
                fillOpacity={0.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        {/* 범례 */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {budgetTypes.slice(0, 5).map((bt: { name: string }, i: number) => (
            <div key={bt.name} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i] }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{bt.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 상세 테이블 ===== */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          📋 사업유형별 상세
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>사업유형</th>
                <th className="text-right">매출 합계</th>
                <th className="text-right">거래 건수</th>
                <th className="text-right">건당 평균</th>
                <th className="text-right">비중</th>
              </tr>
            </thead>
            <tbody>
              {budgetTypes.map((bt: { name: string; revenue: number; count: number; avgPerTransaction: number }, i: number) => {
                const pct = data.summary.totalRevenue > 0
                  ? ((bt.revenue / data.summary.totalRevenue) * 100).toFixed(1)
                  : '0.0';
                return (
                  <tr key={bt.name}>
                    <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td className="font-medium">{bt.name}</td>
                    <td className="text-right font-mono">{formatKRW(bt.revenue)}</td>
                    <td className="text-right font-mono">{formatNumber(bt.count)}</td>
                    <td className="text-right font-mono">{formatKRW(bt.avgPerTransaction)}</td>
                    <td className="text-right font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
