// 탭 2: 부서/센터별 분석
import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Treemap, LineChart, Line,
} from 'recharts';
import { formatKRW, formatNumber, tooltipStyle, CHART_COLORS } from '../utils/format';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

// Treemap 커스텀 콘텐츠
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TreemapContent(props: any) {
  const { x, y, width, height, name, revenue } = props;
  if (width < 60 || height < 40) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={props.fill} fillOpacity={0.85} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
      <text x={x + 8} y={y + 18} fill="#fff" fontSize={12} fontWeight={600}>
        {name.length > 8 ? name.slice(0, 8) + '…' : name}
      </text>
      {width > 80 && height > 50 && (
        <text x={x + 8} y={y + 34} fill="rgba(255,255,255,0.7)" fontSize={11}>
          {formatKRW(revenue)}
        </text>
      )}
    </g>
  );
}

export function DeptTab({ data }: Props) {
  const { departments } = data;
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  // Top 15 부서
  const top15 = departments.slice(0, 15);

  // Treemap 데이터
  const treemapData = useMemo(() => {
    return top15.map((d: { name: string; revenue: number }, i: number) => ({
      name: d.name,
      size: Math.max(d.revenue, 0),
      revenue: d.revenue,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [top15]);

  // 부서 선택 토글
  const toggleDept = (name: string) => {
    setSelectedDepts((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  // 선택된 부서들의 월별 추이
  const deptTrends = useMemo(() => {
    if (selectedDepts.length === 0) return [];

    // 모든 월 수집
    const allMonths = new Set<string>();
    for (const dept of departments) {
      if (selectedDepts.includes(dept.name)) {
        for (const m of dept.monthly) {
          allMonths.add(m.yearMonth);
        }
      }
    }

    const monthlyMap: Record<string, Record<string, number>> = {};
    for (const ym of allMonths) {
      monthlyMap[ym] = {};
    }

    for (const dept of departments) {
      if (selectedDepts.includes(dept.name)) {
        for (const m of dept.monthly) {
          monthlyMap[m.yearMonth][dept.name] = m.revenue;
        }
      }
    }

    return Object.keys(monthlyMap)
      .sort()
      .map((ym) => ({
        yearMonth: ym,
        ...monthlyMap[ym],
      }));
  }, [departments, selectedDepts]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ===== 부서별 매출 순위 (Horizontal Bar) ===== */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          🏢 부서별 매출 순위 (Top 15)
        </h3>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={top15} layout="vertical" margin={{ left: 120 }}>
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
              width={120}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: any) => [formatKRW(value, false), '매출']}
            />
            <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
              {top15.map((_: unknown, i: number) => (
                <rect key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== 하단 2열 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treemap */}
        <div className="card">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            📦 매출 비중 (Treemap)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              data={treemapData}
              dataKey="size"
              stroke="none"
              content={<TreemapContent />}
            />
          </ResponsiveContainer>
        </div>

        {/* 부서 선택 추이 */}
        <div className="card">
          <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            📈 부서별 월별 추이 비교
          </h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            아래에서 비교할 부서를 선택하세요 (복수 선택 가능)
          </p>

          {/* 부서 선택 칩 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {top15.slice(0, 10).map((dept: { name: string }, i: number) => (
              <button
                key={dept.name}
                onClick={() => toggleDept(dept.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedDepts.includes(dept.name)
                    ? 'text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{
                  background: selectedDepts.includes(dept.name)
                    ? CHART_COLORS[i % CHART_COLORS.length]
                    : 'var(--bg-secondary)',
                  border: `1px solid ${
                    selectedDepts.includes(dept.name)
                      ? 'transparent'
                      : 'var(--border-subtle)'
                  }`,
                }}
              >
                {dept.name}
              </button>
            ))}
          </div>

          {/* 추이 차트 */}
          {selectedDepts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={deptTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="yearMonth"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(v: string) => {
                    const parts = v.split('-');
                    return parts[1] === '01' ? parts[0] : '';
                  }}
                  interval={5}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(v: number) => formatKRW(v)}
                  width={60}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value: any, name: any) => [formatKRW(value, false), name]}
                />
                {selectedDepts.map((dept) => (
                  <Line
                    key={dept}
                    dataKey={dept}
                    stroke={CHART_COLORS[top15.findIndex((d: { name: string }) => d.name === dept) % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    type="monotone"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">부서를 선택하면 추이를 볼 수 있습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== 부서별 상세 테이블 ===== */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          📋 부서별 상세 성과
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>부서/센터</th>
                <th className="text-right">매출 합계</th>
                <th className="text-right">거래 건수</th>
                <th className="text-right">건당 평균</th>
                <th className="text-right">비중</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept: { name: string; revenue: number; count: number; avgPerTransaction: number }, i: number) => {
                const pct = data.summary.totalRevenue > 0
                  ? ((dept.revenue / data.summary.totalRevenue) * 100).toFixed(1)
                  : '0.0';
                return (
                  <tr key={dept.name}>
                    <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td className="font-medium">{dept.name}</td>
                    <td className="text-right font-mono">{formatKRW(dept.revenue)}</td>
                    <td className="text-right font-mono">{formatNumber(dept.count)}</td>
                    <td className="text-right font-mono">{formatKRW(dept.avgPerTransaction)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(parseFloat(pct) * 3, 100)}%`,
                              background: CHART_COLORS[i % CHART_COLORS.length],
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
                      </div>
                    </td>
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
