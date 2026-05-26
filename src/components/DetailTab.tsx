import { useState } from 'react';
import { formatKRW } from '../utils/format';

interface Transaction {
  d: string;
  dept: string;
  bt: string;
  cust: string;
  prod: string;
  amt: number;
  mt: string;
  ks: string;
  iso: string;
  br: string;
  jur: string;
}

interface Props {
  data: {
    transactions: Transaction[];
  };
}

export function DetailTab({ data }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filtered = data.transactions.filter(
    (tx) =>
      tx.cust.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.prod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="card space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          📊 상세 거래 내역
        </h3>
        <input
          type="text"
          placeholder="고객명, 부서, 자재명 검색..."
          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-sm w-full sm:w-64"
          style={{ color: 'var(--text-primary)' }}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-3">일자</th>
              <th className="text-left py-2 px-3">고객명</th>
              <th className="text-left py-2 px-3">부서</th>
              <th className="text-left py-2 px-3">예산(목)</th>
              <th className="text-left py-2 px-3">자재/교육명</th>
              <th className="text-right py-2 px-3">금액</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((tx, idx) => (
              <tr key={idx} className="border-t border-slate-800">
                <td className="py-2 px-3 text-slate-400">{tx.d}</td>
                <td className="py-2 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>{tx.cust}</td>
                <td className="py-2 px-3 text-slate-300">{tx.dept}</td>
                <td className="py-2 px-3 text-slate-400">{tx.bt}</td>
                <td className="py-2 px-3 text-slate-300">{tx.prod}</td>
                <td
                  className={`py-2 px-3 text-right font-mono font-medium ${
                    tx.amt >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatKRW(tx.amt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 text-xs text-slate-400">
          <span>
            총 {filtered.length.toLocaleString()}건 중 {startIndex + 1} -{' '}
            {Math.min(startIndex + itemsPerPage, filtered.length)}건 표시
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
            >
              이전
            </button>
            <span className="py-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
