import { useState, useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { CompareTable } from './CompareTable';
import { Calendar, Plus, Trash2 } from 'lucide-react';

interface Period {
  id: string;
  name: string;
  start: string;
  end: string;
}

export function CompareTab() {
  const { salesData } = useDashboard();
  const [topLimit, setTopLimit] = useState<number>(20); // 기본값 상위 20개

  // 사용 가능한 연월 목록 추출 및 정렬
  const availableMonths = useMemo(() => {
    const months = salesData.map(r => `${r.year}-${String(r.month).padStart(2, '0')}`);
    return Array.from(new Set(months)).sort();
  }, [salesData]);

  // 기본 구간 2개로 초기화
  const [periods, setPeriods] = useState<Period[]>(() => {
    const defaultStart = '2021-01';
    const defaultEnd = '2026-02';
    return [
      { id: '1', name: '구간 1', start: defaultStart, end: defaultEnd },
      { id: '2', name: '구간 2', start: defaultStart, end: defaultEnd },
    ];
  });

  // 구간 추가
  const handleAddPeriod = () => {
    if (periods.length >= 4) {
      alert('최대 4개 구간까지만 비교할 수 있습니다.');
      return;
    }
    const nextIndex = periods.length + 1;
    const defaultStart = availableMonths[0] || '2021-01';
    const defaultEnd = availableMonths[availableMonths.length - 1] || '2026-02';

    setPeriods([
      ...periods,
      {
        id: Date.now().toString(),
        name: `구간 ${nextIndex}`,
        start: defaultStart,
        end: defaultEnd,
      },
    ]);
  };

  // 구간 삭제
  const handleRemovePeriod = (id: string) => {
    if (periods.length <= 2) {
      alert('비교를 위해서는 최소 2개 이상의 구간이 필요합니다.');
      return;
    }
    const updated = periods.filter((p) => p.id !== id).map((p, idx) => ({
      ...p,
      name: `구간 ${idx + 1}` // 구간 이름 자동 순번 정렬
    }));
    setPeriods(updated);
  };

  // 구간 값 변경
  const handleUpdatePeriod = (id: string, field: 'name' | 'start' | 'end', value: string) => {
    setPeriods(
      periods.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        // 시작 연월이 종료 연월보다 늦은 경우 보정
        if (field === 'start' && updated.start > updated.end) {
          updated.end = updated.start;
        } else if (field === 'end' && updated.end < updated.start) {
          updated.start = updated.end;
        }
        return updated;
      })
    );
  };

  // 각 구간별 독립적인 Top N 순위 계산
  const processedPeriods = useMemo(() => {
    return periods.map((p) => {
      // 1. 기간 필터링
      const filtered = salesData.filter((r) => {
        const rYm = `${r.year}-${String(r.month).padStart(2, '0')}`;
        return rYm >= p.start && rYm <= p.end;
      });

      // 2. 고객/부서/자재 조합별 매출 집계
      const aggMap = new Map<string, { cust: string; dept: string; prod: string; amt: number }>();
      filtered.forEach((r) => {
        const key = `${r.customerName}||${r.department}||${r.materialDetails || '기타'}`;
        const existing = aggMap.get(key);
        if (existing) {
          existing.amt += r.salesAmount;
        } else {
          aggMap.set(key, {
            cust: r.customerName,
            dept: r.department,
            prod: r.materialDetails || '기타',
            amt: r.salesAmount
          });
        }
      });

      // 3. 정렬 및 Top N 추출
      const sorted = Array.from(aggMap.values())
        .sort((a, b) => b.amt - a.amt) // 매출 내림차순
        .slice(0, topLimit); // 상위 N개 추출

      return {
        ...p,
        list: sorted,
      };
    });
  }, [periods, salesData, topLimit]);

  return (
    <div className="space-y-6">
      {/* 안내 문구 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Calendar size={20} className="text-indigo-600" />
            자유 기간 비교 분석
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            각 구간별로 임의의 기간을 설정하여, 각 구간에 해당하는 상위 매출 순위 리스트를 나란히 비교할 수 있습니다.
          </p>
        </div>

        {/* 상위 노출 갯수 필터 */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-slate-600">조회 순위 범위:</span>
          <select
            value={topLimit}
            onChange={(e) => setTopLimit(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:border-indigo-500"
          >
            <option value={10}>상위 10개</option>
            <option value={20}>상위 20개</option>
            <option value={30}>상위 30개</option>
            <option value={50}>상위 50개</option>
          </select>
        </div>
      </div>

      {/* 구간 설정 패널 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {periods.map((p, idx) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative flex flex-col justify-between hover:shadow transition-all">
            {/* 상단 닫기 버튼 */}
            {periods.length > 2 && (
              <button
                onClick={() => handleRemovePeriod(p.id)}
                className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 transition-colors"
                title="구간 제거"
              >
                <Trash2 size={16} />
              </button>
            )}

            <div className="space-y-3">
              <div className="text-xs font-semibold text-indigo-600">구간 {idx + 1} 설정</div>
              
              {/* 구간명 입력 */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">구간명</label>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => handleUpdatePeriod(p.id, 'name', e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 기간 선택 (연월) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">시작 연월</label>
                  <select
                    value={p.start}
                    onChange={(e) => handleUpdatePeriod(p.id, 'start', e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                  >
                    {availableMonths.map((ym) => (
                      <option key={ym} value={ym}>
                        {ym}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">종료 연월</label>
                  <select
                    value={p.end}
                    onChange={(e) => handleUpdatePeriod(p.id, 'end', e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                  >
                    {availableMonths.map((ym) => (
                      <option key={ym} value={ym}>
                        {ym}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 구간 추가 카드 */}
        {periods.length < 4 && (
          <button
            onClick={handleAddPeriod}
            className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer min-h-[120px] w-full"
          >
            <Plus size={20} />
            <span className="text-xs font-semibold">비교 구간 추가</span>
          </button>
        )}
      </div>

      {/* 테이블 결과 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-800">
            🏆 구간별 매출액 순위 비교 테이블 (상위 {topLimit}개)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            각 구간별로 독립적으로 집계된 매출 상위 항목 리스트가 나란히 비교 출력됩니다.
          </p>
        </div>

        <CompareTable periods={processedPeriods} limit={topLimit} />
      </div>
    </div>
  );
}
