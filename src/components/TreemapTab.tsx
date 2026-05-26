import React, { useState, useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Filter, Search, Calendar, CheckSquare, Square, X } from 'lucide-react';
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
//   - 글씨 가독성 향상을 위해 Bold 해제 (normal 굵기 적용)
//   - 노드 클릭 기능 탑재
// ──────────────────────────────────────────────────────────────────
function CustomTreemapNode(props: any) {
  const { x, y, width, height, name, amt, percent, index, onNodeClick } = props;
  
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
    <g onClick={() => onNodeClick && onNodeClick(name)} className="cursor-pointer">
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
      {/* 텍스트 노출 (높이/너비 제약 조건 충족 시에만 상세정보 표출, Bold 해제) */}
      {width > 50 && height > 25 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (height > 45 ? 6 : 0)}
          fill="#ffffff"
          fontSize={nameFontSize}
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
          {/* 비중 % 표시 (Bold 해제) */}
          <text
            x={x + width / 2}
            y={y + height / 2 + 20}
            fill="rgba(255,255,255,0.8)"
            fontSize={valFontSize - 1}
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

  // 2. 필터 및 기간 선택 상태 정의 (구간 2는 디폴트 '선택 안 함' 상태로 두어 1구간 전체 화면이 먼저 보이도록 함)
  const [period1, setPeriod1] = useState({ start: '2021-01', end: '2026-02' });
  const [period2, setPeriod2] = useState({ start: '', end: '' });
  
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
      memberStatuses: Array.from(members).sort((a, b: any) => {
        const order = ['대기업', '중소기업', '소기업', '단체', '비회원'];
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      })
    };
  }, [salesData]);

  // 로컬 필터 상태
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [ksCertFilter, setKsCertFilter] = useState<boolean | null>(null); // null(무관), true(O), false(X)
  const [isoCertFilter, setIsoCertFilter] = useState<boolean | null>(null);
  const [custSearch, setCustSearch] = useState('');

  // 클릭된 고객사에 대한 상세 보기 오버레이 팝업 상태 (각 구간별 독립)
  const [selectedCustomer1, setSelectedCustomer1] = useState<string | null>(null);
  const [selectedCustomer2, setSelectedCustomer2] = useState<string | null>(null);

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
  //   - 방식 2 피드백 반영: 시작 또는 종료 연월 중 하나만 유효해도 1개월 단위 등으로 데이터 자동 연산
  const getTreemapData = (startStr: string, endStr: string) => {
    const start = startStr || endStr;
    const end = endStr || startStr;

    if (!start || !end) {
      return { data: [], totalRevenue: 0 };
    }

    // 날짜 기간 필터링
    const periodFiltered = globallyFilteredSales.filter((r) => {
      const ym = `${r.year}-${String(r.month).padStart(2, '0')}`;
      return ym >= start && ym <= end;
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

  // 특정 고객사의 기간 내 매출 리스트 중 상위 5개 가공 헬퍼
  const getDetailedSales = (customerName: string, startStr: string, endStr: string) => {
    const start = startStr || endStr;
    const end = endStr || startStr;
    if (!customerName || !start || !end) return [];
    
    const matched = globallyFilteredSales.filter(r => {
      const ym = `${r.year}-${String(r.month).padStart(2, '0')}`;
      return ym >= start && ym <= end && r.customerName === customerName;
    });
    return [...matched].sort((a, b) => b.salesAmount - a.salesAmount).slice(0, 5);
  };

  // 구간 2 활성화 여부 판별 (방식 2: 시작일 또는 종료일 둘 중 하나만 선택해도 활성화로 처리)
  const isPeriod2Active = period2.start !== '' || period2.end !== '';
  
  // 화면 표출용 구간 2 연월 텍스트
  const period2StartToShow = period2.start || period2.end;
  const period2EndToShow = period2.end || period2.start;

  // 다중 선택 유틸
  const toggleSelect = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  };

  // 활성화된 필터 개수 계산
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    count += selectedDepts.length;
    count += selectedBudgets.length;
    count += selectedMembers.length;
    if (ksCertFilter !== null) count += 1;
    if (isoCertFilter !== null) count += 1;
    if (custSearch) count += 1;
    return count;
  }, [selectedDepts, selectedBudgets, selectedMembers, ksCertFilter, isoCertFilter, custSearch]);

  const handleResetFilters = () => {
    setSelectedDepts([]);
    setSelectedBudgets([]);
    setSelectedMembers([]);
    setKsCertFilter(null);
    setIsoCertFilter(null);
    setCustSearch('');
  };

  // 사이드바의 체크박스 그룹 렌더러 (FilterSidebar.tsx 디자인 및 기능 복제)
  const renderSidebarCheckboxGroup = (
    title: string,
    items: string[],
    selectedItems: string[],
    setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 ml-1 pr-1">
          <h4 className="font-semibold text-slate-700 text-sm">{title}</h4>
          <div className="flex items-center space-x-2 text-xs text-indigo-600">
            <button
              onClick={() => setSelectedItems([...items])}
              className="hover:text-indigo-800 transition-colors flex items-center font-medium"
              title="모두 선택"
            >
              <CheckSquare className="w-3.5 h-3.5 mr-0.5" /> 전체
            </button>
            <button
              onClick={() => setSelectedItems([])}
              className="hover:text-indigo-800 transition-colors flex items-center font-medium"
              title="모두 해제"
            >
              <Square className="w-3.5 h-3.5 mr-0.5" /> 해제
            </button>
          </div>
        </div>

        <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
          {items.map(item => {
            const isChecked = selectedItems.includes(item);
            return (
              <label
                key={item}
                className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelect(selectedItems, setSelectedItems, item)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
                />
                <span className="truncate" title={item}>{item}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-slate-50 font-sans overflow-hidden">
      {/* ── 좌측 필터 사이드바 (FilterSidebar.tsx 디자인 100% 동기화 및 마우스 스크롤 교정) ── */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm shrink-0 h-full overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2 text-slate-800">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold">데이터 필터</h3>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs py-0.5 px-2 rounded-full font-medium">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-slate-400 hover:text-red-500 transition-colors bg-slate-100 p-1 rounded-md"
              title="필터 초기화"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-4 overflow-y-auto flex-1 min-h-0 bg-slate-50/50 custom-scrollbar pr-2">
          {/* 고객명 검색 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 ml-1 pr-1">
              <h4 className="font-semibold text-slate-700 text-sm">고객명 검색</h4>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="고객명 검색..."
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                className="block w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 사업부서명 */}
          {renderSidebarCheckboxGroup("사업부서명 (이름)", uniqueValues.departments, selectedDepts, setSelectedDepts)}

          {/* 예산(목) */}
          {renderSidebarCheckboxGroup("예산 (목)", uniqueValues.budgetTypes, selectedBudgets, setSelectedBudgets)}

          {/* 인증 현황 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 ml-1 pr-1">
              <h4 className="font-semibold text-slate-700 text-sm">인증 현황</h4>
              <div className="flex items-center space-x-2 text-xs text-indigo-600">
                <button 
                  onClick={() => { setKsCertFilter(null); setIsoCertFilter(null); }} 
                  className="hover:text-indigo-800 transition-colors flex items-center font-medium" 
                  title="모두 해제"
                >
                  <Square className="w-3.5 h-3.5 mr-0.5" /> 전체 해제
                </button>
              </div>
            </div>
            <div className="space-y-4 px-1">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">KS 인증</span>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {([null, true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setKsCertFilter(val)}
                      className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${
                        ksCertFilter === val
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
                <span className="text-xs font-medium text-slate-500 block mb-1">ISO 인증</span>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {([null, true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setIsoCertFilter(val)}
                      className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${
                        isoCertFilter === val
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
          {renderSidebarCheckboxGroup("회원 상태", uniqueValues.memberStatuses, selectedMembers, setSelectedMembers)}
        </div>
      </aside>

      {/* ── 우측 트리맵 콘텐츠 영역 ── */}
      <section className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
        {/* 기간 선택 패널 (WidgetWrapper 스타일 적용) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-6 items-center justify-start shrink-0 w-full">
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-slate-800 text-sm">비교 구간 기간 설정</h4>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
            {/* 구간 1 기간 선택 */}
            <div className="flex items-center gap-2 bg-slate-100/80 hover:bg-slate-100 p-1.5 px-3 rounded-lg text-xs transition-colors">
              <span className="font-bold text-indigo-600 mr-1">구간 1</span>
              <select
                value={period1.start}
                onChange={(e) => setPeriod1(prev => ({ ...prev, start: e.target.value, end: e.target.value < prev.end ? prev.end : e.target.value }))}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 font-semibold cursor-pointer py-0.5 text-xs"
              >
                {availableMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
              </select>
              <span className="text-slate-400 font-medium">~</span>
              <select
                value={period1.end}
                onChange={(e) => setPeriod1(prev => ({ ...prev, end: e.target.value, start: e.target.value > prev.start ? prev.start : e.target.value }))}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 font-semibold cursor-pointer py-0.5 text-xs"
              >
                {availableMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
              </select>
            </div>

            {/* 구간 2 기간 선택 */}
            <div className="flex items-center gap-2 bg-slate-100/80 hover:bg-slate-100 p-1.5 px-3 rounded-lg text-xs transition-colors">
              <span className="font-bold text-emerald-600 mr-1">구간 2</span>
              <select
                value={period2.start}
                onChange={(e) => {
                  const val = e.target.value;
                  setPeriod2(prev => {
                    const newStart = val;
                    let newEnd = prev.end;
                    if (val && (!prev.end || val > prev.end)) {
                      newEnd = val;
                    }
                    return { start: newStart, end: newEnd };
                  });
                }}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 font-semibold cursor-pointer py-0.5 text-xs"
              >
                <option value="">[선택 안 함]</option>
                {availableMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
              </select>
              <span className="text-slate-400 font-medium">~</span>
              <select
                value={period2.end}
                onChange={(e) => {
                  const val = e.target.value;
                  setPeriod2(prev => {
                    const newEnd = val;
                    let newStart = prev.start;
                    if (val && (!prev.start || val < prev.start)) {
                      newStart = val;
                    }
                    return { start: newStart, end: newEnd };
                  });
                }}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 font-semibold cursor-pointer py-0.5 text-xs"
              >
                <option value="">[선택 안 함]</option>
                {availableMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 트리맵 배치 그리드 (flex-row를 사용하여 항상 가로 50:50 좌우 1:1 배치 강제, 쏠림 해결) */}
        <div className="flex flex-row gap-6 flex-1 min-h-[480px] w-full">
          {/* 구간 1 트리맵 (isPeriod2Active 상태에 따라 flex-1 w-1/2 min-w-0 또는 w-full flex-grow 동적 확장) */}
          <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full relative overflow-hidden ${
            isPeriod2Active ? 'flex-grow flex-1 w-1/2 min-w-0' : 'w-full flex-grow flex-1 min-w-0'
          }`}>
            {/* 개선된 카드 헤더 */}
            <div className="px-5 pt-5 pb-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h5 className="font-bold text-slate-800 text-sm">
                    구간 1 매출 비중
                  </h5>
                  <span className="font-normal text-slate-500 text-xs font-mono">({period1.start} ~ {period1.end})</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-xs">
                  <span className="text-slate-400 font-medium">총 매출액</span>
                  <span className="font-bold text-indigo-600 font-mono">
                    ₩{Math.round(treemap1.totalRevenue).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            {/* 왼쪽부터 오른쪽까지 긋는 금(경계선) */}
            <div className="border-b border-slate-200/80 w-full shrink-0" />

            {/* 카드 바디 */}
            <div className="flex-1 p-5 min-h-[400px]">
              {treemap1.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemap1.data}
                    dataKey="size"
                    stroke="#ffffff"
                    isAnimationActive={false} // 유입 애니메이션 제거
                    content={<CustomTreemapNode onNodeClick={(name: string) => setSelectedCustomer1(name)} />}
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

            {/* 구간 1 실적 상세 오버레이 팝업 */}
            {selectedCustomer1 && (
              <div className="absolute inset-0 bg-white shadow-2xl z-20 rounded-xl overflow-hidden flex flex-col p-4 animate-fade-in">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{selectedCustomer1} 실적 상세 (구간 1)</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">상위 5개 매출 거래 내역</p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer1(null)}
                    className="text-xs font-medium text-slate-500 hover:text-red-500 transition-colors px-2 py-1 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100"
                  >
                    닫기 ✕
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar mt-3">
                  <table className="w-full text-xs text-left table-fixed">
                    <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 w-[30%]">부서(이름)</th>
                        <th className="px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 w-[45%]">대표 자재내역</th>
                        <th className="px-3 py-2 font-semibold text-slate-600 text-right border-b border-slate-200 w-[25%]">순매출액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getDetailedSales(selectedCustomer1, period1.start, period1.end).map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 text-slate-700 truncate" title={r.department}>{r.department || '-'}</td>
                          <td className="px-3 py-2 text-slate-500 truncate" title={r.materialDetails}>{r.materialDetails || '-'}</td>
                          <td className="px-3 py-2 text-right text-slate-800 font-semibold font-mono">
                            ₩{Math.round(r.salesAmount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 구간 2 트리맵 (활성화되었을 때만 렌더링, flex-grow w-1/2 min-w-0 적용으로 좌우 대칭 화면 확장) */}
          {isPeriod2Active && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full relative overflow-hidden flex-grow flex-1 w-1/2 min-w-0">
              {/* 개선된 카드 헤더 */}
              <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-slate-800 text-sm">
                      구간 2 매출 비중
                    </h5>
                    <span className="font-normal text-slate-500 text-xs font-mono">({period2StartToShow} ~ {period2EndToShow})</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-xs">
                    <span className="text-slate-400 font-medium">총 매출액</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      ₩{Math.round(treemap2.totalRevenue).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {/* 왼쪽부터 오른쪽까지 긋는 금(경계선) */}
              <div className="border-b border-slate-200/80 w-full shrink-0" />

              {/* 카드 바디 */}
              <div className="flex-1 p-5 min-h-[400px]">
                {treemap2.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={treemap2.data}
                      dataKey="size"
                      stroke="#ffffff"
                      isAnimationActive={false} // 유입 애니메이션 제거
                      content={<CustomTreemapNode onNodeClick={(name: string) => setSelectedCustomer2(name)} />}
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

              {/* 구간 2 실적 상세 오버레이 팝업 */}
              {selectedCustomer2 && (
                <div className="absolute inset-0 bg-white shadow-2xl z-20 rounded-xl overflow-hidden flex flex-col p-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{selectedCustomer2} 실적 상세 (구간 2)</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">상위 5개 매출 거래 내역</p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer2(null)}
                      className="text-xs font-medium text-slate-500 hover:text-red-500 transition-colors px-2 py-1 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100"
                    >
                      닫기 ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar mt-3">
                    <table className="w-full text-xs text-left table-fixed">
                      <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
                        <tr>
                          <th className="px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 w-[30%]">부서(이름)</th>
                          <th className="px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 w-[45%]">대표 자재내역</th>
                          <th className="px-3 py-2 font-semibold text-slate-600 text-right border-b border-slate-200 w-[25%]">순매출액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getDetailedSales(selectedCustomer2, period2.start, period2.end).map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 text-slate-700 truncate" title={r.department}>{r.department || '-'}</td>
                            <td className="px-3 py-2 text-slate-500 truncate" title={r.materialDetails}>{r.materialDetails || '-'}</td>
                            <td className="px-3 py-2 text-right text-slate-800 font-semibold font-mono">
                              ₩{Math.round(r.salesAmount).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
