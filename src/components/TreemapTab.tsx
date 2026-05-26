import React, { useState, useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Filter, Search, Calendar } from 'lucide-react';
import { CHART_COLORS } from '../utils/format';

interface SalesRecord {
  year: number;
  month: number;
  dateStr: string;
  department: string;
  budgetType: string;
  materialDetails?: string;
  customerName: string;
  salesAmount: number;
  ksCert: boolean;
  isoCert: boolean;
  memberStatus: string;
}

// ──────────────────────────────────────────────────────────────────
// ★ Finviz 스타일 트리맵 커스텀 노드 렌더러
//   - 박스 면적에 맞게 폰트 크기 및 텍스트 행 수 동적 제어
//   - 상위 30% 이내 주요 항목은 좀 더 밝은 계열 색상 강조
// ──────────────────────────────────────────────────────────────────
function CustomTreemapNode(props: any) {
  const { x, y, width, height, name, amt, percent, index } = props;
  
  // name이 없거나 크기가 너무 작으면 렌더링하지 않음 (Recharts Root 노드 등 예외 처리)
  if (!name || width < 35 || height < 20) return null;

  const safeIndex = index ?? 0;
  const safeAmt = amt ?? 0;
  const safePercent = percent ?? 0;

  // 색상 지정: index를 기반으로 CHART_COLORS 순환 사용하되, 비중 강도에 따라 투명도 차별화
  const baseColor = CHART_COLORS[safeIndex % CHART_COLORS.length];
  const fillOpacity = width > 120 && height > 80 ? 0.9 : 0.75;

  // 폰트 크기 동적 결정
  const nameFontSize = width > 100 ? 11 : 9;
  const valFontSize = width > 100 ? 10 : 8;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={baseColor}
        fillOpacity={fillOpacity}
        stroke="#ffffff"
        strokeWidth={1.5}
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
      />
      {/* 텍스트 노출 (높이/너비 제약 조건 충족 시에만 상세정보 표출) */}
      {width > 50 && height > 25 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (height > 45 ? 6 : 0)}
          fill="#ffffff"
          fontSize={nameFontSize}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {name.length > Math.floor(width / 10) ? name.slice(0, Math.floor(width / 10) - 1) + '..' : name}
        </text>
      )}
      
      {width > 90 && height > 55 && (
        <>
          {/* 금액 표시 */}
          <text
            x={x + width / 2}
            y={y + height / 2 + 8}
            fill="rgba(255,255,255,0.95)"
            fontSize={valFontSize}
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            ₩{Math.round(safeAmt).toLocaleString()}
          </text>
          {/* 비중 % 표시 */}
          <text
            x={x + width / 2}
            y={y + height / 2 + 20}
            fill="rgba(255,255,255,0.8)"
            fontSize={valFontSize - 1}
            fontWeight={600}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {safePercent.toFixed(1)}%
          </text>
        </>
      )}
    </g>
  );
}

export function TreemapTab() {
  const { salesData } = useDashboard();
  
  // 1. 가용 기간 추출
  const availableMonths = useMemo(() => {
    const months = salesData.map(r => `${r.year}-${String(r.month).padStart(2, '0')}`);
    return Array.from(new Set(months)).sort();
  }, [salesData]);

  // 2. 필터 및 기간 선택 상태 정의 (구간은 최대 2개 고정)
  const [period1, setPeriod1] = useState({ start: '2021-01', end: '2026-02' });
  const [period2, setPeriod2] = useState({ start: '2023-04', end: '2026-02' });
  
  // 사이드바 필터 고유 값 추출
  const uniqueValues = useMemo(() => {
    const depts = new Set<string>();
    const budgets = new Set<string>();
    const members = new Set<string>();
    
    salesData.forEach(r => {
      if (r.department) depts.add(r.department);
      if (r.budgetType) budgets.add(r.budgetType);
      if (r.memberStatus) members.add(r.memberStatus);
    });

    return {
      departments: Array.from(depts).sort(),
      budgetTypes: Array.from(budgets).sort(),
      memberStatuses: Array.from(members).sort()
    };
  }, [salesData]);

  // 로컬 필터 상태
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [ksCertFilter, setKsCertFilter] = useState<boolean | null>(null); // null(무관), true(O), false(X)
  const [isoCertFilter, setIsoCertFilter] = useState<boolean | null>(null);
  const [custSearch, setCustSearch] = useState('');

  // 필터 초기화
  const handleResetFilters = () => {
    setSelectedDepts([]);
    setSelectedBudgets([]);
    setSelectedMembers([]);
    setKsCertFilter(null);
    setIsoCertFilter(null);
    setCustSearch('');
  };

  // 필터 조건 만족 여부 확인
  const isRecordValid = (r: SalesRecord) => {
    if (selectedDepts.length > 0 && !selectedDepts.includes(r.department)) return false;
    if (selectedBudgets.length > 0 && !selectedBudgets.includes(r.budgetType)) return false;
    if (selectedMembers.length > 0 && !selectedMembers.includes(r.memberStatus)) return false;
    if (ksCertFilter !== null && r.ksCert !== ksCertFilter) return false;
    if (isoCertFilter !== null && r.isoCert !== isoCertFilter) return false;
    if (custSearch && !r.customerName.toLowerCase().includes(custSearch.toLowerCase())) return false;
    return true;
  };

  // 공통 조건 필터링된 SalesData
  const globallyFilteredSales = useMemo(() => {
    return salesData.filter(isRecordValid);
  }, [salesData, selectedDepts, selectedBudgets, selectedMembers, ksCertFilter, isoCertFilter, custSearch]);

  // 3. 각 구간별 트리맵 데이터 연산 (고객별 총매출액 집계, 음수 제외, Top 30 제한)
  const getTreemapData = (startStr: string, endStr: string) => {
    // 날짜 기간 필터링
    const periodFiltered = globallyFilteredSales.filter((r) => {
      const ym = `${r.year}-${String(r.month).padStart(2, '0')}`;
      return ym >= startStr && ym <= endStr;
    });

    // 고객별 집계
    const custMap = new Map<string, number>();
    periodFiltered.forEach((r) => {
      custMap.set(r.customerName, (custMap.get(r.customerName) || 0) + r.salesAmount);
    });

    // 0 이하 금액 제외 및 가공
    const list = Array.from(custMap.entries())
      .filter(([_, amount]) => amount > 0)
      .map(([name, amount]) => ({
        name,
        amt: amount,
        size: amount // recharts treemap에서 면적 기준 변수로 사용
      }))
      .sort((a, b) => b.amt - a.amt);

    const totalRevenue = list.reduce((sum, item) => sum + item.amt, 0);

    // 비중 백분율 계산 및 Top 30 추출
    const top30 = list.slice(0, 30).map((item) => ({
      ...item,
      percent: totalRevenue > 0 ? (item.amt / totalRevenue) * 100 : 0
    }));

    return {
      data: top30,
      totalRevenue
    };
  };

  const treemap1 = useMemo(() => getTreemapData(period1.start, period1.end), [globallyFilteredSales, period1]);
  const treemap2 = useMemo(() => getTreemapData(period2.start, period2.end), [globallyFilteredSales, period2]);

  // 다중 선택 유틸
  const toggleSelect = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  };

  return (
    <div className="flex h-[calc(100vh-62px)] bg-slate-50 font-sans">
      {/* ── 좌측 필터 사이드바 (연도/월 제외) ── */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm shrink-0 h-full overflow-y-auto">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2 text-slate-800">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm">트리맵 데이터 필터</h3>
          </div>
          {(selectedDepts.length > 0 || selectedBudgets.length > 0 || selectedMembers.length > 0 || ksCertFilter !== null || isoCertFilter !== null || custSearch) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-500 hover:text-rose-700 transition-colors font-medium"
            >
              필터 초기화
            </button>
          )}
        </div>

        <div className="p-4 space-y-6">
          {/* 고객명 검색 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">고객명 검색</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="고객명 입력..."
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 사업부서명 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700">사업부서명 (이름)</label>
              <button
                onClick={() => setSelectedDepts(selectedDepts.length === uniqueValues.departments.length ? [] : [...uniqueValues.departments])}
                className="text-[10px] text-indigo-600 font-semibold"
              >
                {selectedDepts.length === uniqueValues.departments.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="max-h-36 overflow-y-auto border border-slate-100 rounded-md p-2 bg-slate-50/50 space-y-1">
              {uniqueValues.departments.map(dept => (
                <label key={dept} className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer p-0.5 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={selectedDepts.includes(dept)}
                    onChange={() => toggleSelect(selectedDepts, setSelectedDepts, dept)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="truncate">{dept}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 예산(목) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700">예산 (목)</label>
              <button
                onClick={() => setSelectedBudgets(selectedBudgets.length === uniqueValues.budgetTypes.length ? [] : [...uniqueValues.budgetTypes])}
                className="text-[10px] text-indigo-600 font-semibold"
              >
                {selectedBudgets.length === uniqueValues.budgetTypes.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="max-h-36 overflow-y-auto border border-slate-100 rounded-md p-2 bg-slate-50/50 space-y-1">
              {uniqueValues.budgetTypes.map(b => (
                <label key={b} className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer p-0.5 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={selectedBudgets.includes(b)}
                    onChange={() => toggleSelect(selectedBudgets, setSelectedBudgets, b)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="truncate">{b}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 인증 현황 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">인증 보유 여부</label>
            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">KS 인증</span>
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  {([null, true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setKsCertFilter(val)}
                      className={`flex-1 text-[10px] py-1 rounded-md transition-all font-medium ${ksCertFilter === val
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {val === null ? '무관' : val ? '인증 O' : '인증 X'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">ISO 인증</span>
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  {([null, true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setIsoCertFilter(val)}
                      className={`flex-1 text-[10px] py-1 rounded-md transition-all font-medium ${isoCertFilter === val
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {val === null ? '무관' : val ? '인증 O' : '인증 X'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 회원 상태 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">회원 상태</label>
            <div className="space-y-1.5">
              {uniqueValues.memberStatuses.map(status => (
                <label key={status} className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer p-0.5 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(status)}
                    onChange={() => toggleSelect(selectedMembers, setSelectedMembers, status)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── 우측 트리맵 콘텐츠 영역 ── */}
      <section className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        {/* 기간 선택 패널 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-slate-800 text-sm">비교 구간 기간 설정 (최대 2구간)</h4>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* 구간 1 기간 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">구간 1</span>
              <select
                value={period1.start}
                onChange={(e) => setPeriod1(prev => ({ ...prev, start: e.target.value, end: e.target.value < prev.end ? prev.end : e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
              >
                {availableMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
              </select>
              <span className="text-slate-400 text-xs">~</span>
              <select
                value={period1.end}
                onChange={(e) => setPeriod1(prev => ({ ...prev, end: e.target.value, start: e.target.value > prev.start ? prev.start : e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
              >
                {availableMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
              </select>
            </div>

            {/* 구간 2 기간 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">구간 2</span>
              <select
                value={period2.start}
                onChange={(e) => setPeriod2(prev => ({ ...prev, start: e.target.value, end: e.target.value < prev.end ? prev.end : e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
              >
                {availableMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
              </select>
              <span className="text-slate-400 text-xs">~</span>
              <select
                value={period2.end}
                onChange={(e) => setPeriod2(prev => ({ ...prev, end: e.target.value, start: e.target.value > prev.start ? prev.start : e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
              >
                {availableMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 트리맵 좌우 배치 그리드 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-[480px]">
          {/* 구간 1 트리맵 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-bold text-slate-800 text-sm">구간 1 매출 비중 ({period1.start} ~ {period1.end})</h5>
              <span className="text-xs font-mono text-slate-500">총 ₩{Math.round(treemap1.totalRevenue).toLocaleString()}</span>
            </div>
            <div className="flex-1 min-h-[380px]">
              {treemap1.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemap1.data}
                    dataKey="size"
                    stroke="#ffffff"
                    content={<CustomTreemapNode />}
                  >
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        `₩${Math.round(value).toLocaleString()}`,
                        `고객명: ${name}`
                      ]}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '8px'
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  조건을 충족하는 매출 데이터가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 구간 2 트리맵 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-bold text-slate-800 text-sm">구간 2 매출 비중 ({period2.start} ~ {period2.end})</h5>
              <span className="text-xs font-mono text-slate-500">총 ₩{Math.round(treemap2.totalRevenue).toLocaleString()}</span>
            </div>
            <div className="flex-1 min-h-[380px]">
              {treemap2.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemap2.data}
                    dataKey="size"
                    stroke="#ffffff"
                    content={<CustomTreemapNode />}
                  >
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        `₩${Math.round(value).toLocaleString()}`,
                        `고객명: ${name}`
                      ]}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '8px'
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  조건을 충족하는 매출 데이터가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
