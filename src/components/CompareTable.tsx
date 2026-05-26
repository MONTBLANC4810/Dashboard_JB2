import React from 'react';

interface PeriodData {
  id: string;
  name: string;
  start: string;
  end: string;
  list: Array<{ cust: string; dept: string; prod: string; amt: number }>;
}

interface CompareTableProps {
  periods: PeriodData[];
  limit: number;
}

export function CompareTable({ periods, limit }: CompareTableProps) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="data-table w-full text-xs border-collapse min-w-[1000px]">
        <thead>
          {/* 상단 통합 헤더: 구간 이름 및 연월 범위 */}
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-center font-bold text-slate-700 border-r border-slate-200 py-2 text-xs" style={{ width: '70px' }}>
              순위
            </th>
            {periods.map((p, idx) => (
              <th
                key={p.id}
                colSpan={4}
                className={`text-center font-extrabold text-slate-800 border-r border-slate-200 py-2 text-xs ${
                  idx % 2 === 0 ? 'bg-indigo-50/50' : 'bg-slate-50'
                }`}
              >
                {p.name} ({p.start} ~ {p.end})
              </th>
            ))}
          </tr>
          {/* 하단 세부 열 헤더 */}
          <tr className="border-b border-slate-200 bg-slate-50/30">
            <th className="border-r border-slate-200 py-1.5 text-xs"></th>
            {periods.map((p, idx) => (
              <React.Fragment key={p.id}>
                <th className={`text-left text-slate-600 font-semibold text-[11px] py-1.5 px-2 ${idx % 2 === 0 ? 'bg-indigo-50/20' : ''}`}>고객명</th>
                <th className={`text-left text-slate-600 font-semibold text-[11px] py-1.5 px-2 ${idx % 2 === 0 ? 'bg-indigo-50/20' : ''}`}>부서</th>
                <th className={`text-left text-slate-600 font-semibold text-[11px] py-1.5 px-2 ${idx % 2 === 0 ? 'bg-indigo-50/20' : ''}`}>대표 자재/교육명</th>
                <th className={`text-right text-slate-600 font-semibold text-[11px] py-1.5 px-2 border-r border-slate-200 ${idx % 2 === 0 ? 'bg-indigo-50/20' : ''}`} style={{ width: '140px' }}>
                  순매출액
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: limit }).map((_, rankIndex) => {
            const rank = rankIndex + 1;
            const isTop3 = rank <= 3;

            return (
              <tr key={rankIndex} className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white">
                {/* 순위 열 */}
                <td className={`text-center font-bold border-r border-slate-200 py-2 text-xs ${
                  isTop3 ? 'text-amber-500 font-extrabold text-sm' : 'text-slate-500'
                }`}>
                  {rank}위
                </td>

                {/* 구간별 데이터 열 */}
                {periods.map((p, pIdx) => {
                  const item = p.list[rankIndex];
                  const bgClass = pIdx % 2 === 0 ? 'bg-indigo-50/10' : '';

                  return (
                    <React.Fragment key={p.id}>
                      <td className={`py-2 px-2 text-slate-850 font-medium truncate max-w-[180px] text-xs ${bgClass}`} title={item?.cust || ''}>
                        {item ? item.cust : '-'}
                      </td>
                      <td className={`py-2 px-2 text-slate-600 truncate max-w-[120px] text-xs ${bgClass}`} title={item?.dept || ''}>
                        {item ? item.dept : '-'}
                      </td>
                      <td className={`py-2 px-2 text-slate-500 truncate max-w-[200px] text-xs ${bgClass}`} title={item?.prod || ''}>
                        {item ? item.prod : '-'}
                      </td>
                      <td className={`py-2 px-2 text-right font-mono border-r border-slate-200 font-semibold text-slate-800 text-xs ${bgClass}`} style={{ width: '140px' }}>
                        {item ? `₩ ${item.amt.toLocaleString()}` : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
