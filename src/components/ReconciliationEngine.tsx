import React, { useState } from 'react';
import { ReconciledItem } from '../types';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  ExternalLink,
  Layers,
  ShieldCheck,
  Truck,
  Database
} from 'lucide-react';

interface ReconciliationEngineProps {
  items: ReconciledItem[];
}

export default function ReconciliationEngine({ items }: ReconciliationEngineProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Filters and searches
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sloc.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'ALL' || 
      item.reconciliationStatus === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (key: string) => {
    setExpandedKey(expandedKey === key ? null : key);
  };

  const getStatusBadge = (status: ReconciledItem['reconciliationStatus']) => {
    switch (status) {
      case 'RECONCILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            소명 완료 (Reconciled)
          </span>
        );
      case 'PARTIALLY_RECONCILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            일부 소명 (Partial)
          </span>
        );
      case 'UNRESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            미결 차이 (Unresolved)
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden" id="reconciliation_engine_container">
      {/* Table Title and Control Bar */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            재고 품목별 소명 상태 분석 내역 원장
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            WMS와 ERP의 데이터 불일치 건을 자재코드 및 로트번호 단위로 병합하여 이송중 원장과 자동 매칭한 상세 명세입니다.
          </p>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="자재명, LOT, 저장위치 검색..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">상태 필터:</span>
            <select
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">전체 상태 보기</option>
              <option value="RECONCILED">소명 완료 건만</option>
              <option value="PARTIALLY_RECONCILED">일부 소명 건만</option>
              <option value="UNRESOLVED">미결 차이 건만</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-6 py-3 bg-slate-50 text-xs text-slate-500 border-b border-slate-100 flex justify-between items-center">
        <span>총 {filteredItems.length}건의 불일치 품목 감지됨</span>
        <span className="italic text-[11px]">행을 클릭하면 자재별 ERP vs WMS 및 이송중 상세 내역이 확장됩니다.</span>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/20 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="py-4 px-6">자재코드 / 명세</th>
              <th className="py-4 px-4">로트번호 (LOT_NO)</th>
              <th className="py-4 px-4">저장위치</th>
              <th className="py-4 px-4 text-right">WMS 수량</th>
              <th className="py-4 px-4 text-right">ERP 수량</th>
              <th className="py-4 px-4 text-right text-red-600">장부 차이</th>
              <th className="py-4 px-4 text-center">소명 여부</th>
              <th className="py-4 px-4 text-center">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  검색 필터에 부합하는 재고 차이 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isExpanded = expandedKey === item.key;
                const hasQualityMismatch = item.qualityDiff && (
                  item.qualityDiff.diffInspection !== 0 ||
                  item.qualityDiff.diffAvailable !== 0 ||
                  item.qualityDiff.diffBlocked !== 0 ||
                  item.qualityDiff.diffRestricted !== 0
                );
                const hasTypeMismatch = item.materialTypeDiff && 
                  item.materialTypeDiff.wmsType !== item.materialTypeDiff.erpType;
                
                return (
                  <React.Fragment key={item.key}>
                    <tr 
                      className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-blue-50/15' : ''
                      }`}
                      onClick={() => toggleExpand(item.key)}
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{item.material}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {item.slocDiff?.materialType || 'FERT'} · {item.unit}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-600">
                        {item.lotNo}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded font-medium">
                          {item.sloc || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold">
                        {item.totalWmsQty.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold">
                        {item.totalErpQty.toLocaleString()}
                      </td>
                      <td className={`py-4 px-4 text-right font-extrabold ${
                        item.netDiff < 0 ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {item.netDiff > 0 ? '+' : ''}{item.netDiff.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(item.reconciliationStatus)}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                      </td>
                    </tr>

                    {/* Expandable Reconciliation Detail Card */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="bg-slate-50/30 p-6 border-y border-slate-200/50">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* Left Panel: Discrepancy Breakdown */}
                            <div className="lg:col-span-5 space-y-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                🔍 분야별 불일치 진단 리포트
                              </h4>
                              
                              <div className="bg-white rounded-lg border border-slate-200/60 p-4 space-y-3.5 shadow-xs">
                                {/* Storage Location Info */}
                                <div>
                                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                                    <span>재고수량 및 위치 차이</span>
                                    <span className="text-slate-400">저장위치 수량</span>
                                  </div>
                                  <p className="text-xs text-slate-500 leading-normal">
                                    WMS SLoc: <span className="font-semibold text-slate-700">{item.slocDiff?.wmsSLoc || '없음'}</span> ({item.slocDiff?.wmsQty.toLocaleString() || 0} KG) <br />
                                    ERP SLoc: <span className="font-semibold text-slate-700">{item.slocDiff?.erpSLoc || '없음'}</span> ({item.slocDiff?.erpQty.toLocaleString() || 0} KG)
                                  </p>
                                </div>

                                {/* Quality Status */}
                                {item.qualityDiff && (
                                  <div className="pt-3 border-t border-slate-100">
                                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1.5">
                                      <span>재고 품질 상태 매핑</span>
                                      {hasQualityMismatch ? (
                                        <span className="text-red-500 text-[10px] bg-red-50 px-1.5 py-0.5 rounded font-bold">상태 불일치 발견</span>
                                      ) : (
                                        <span className="text-green-600 text-[10px] bg-green-50 px-1.5 py-0.5 rounded font-bold">품질상태 완벽일치</span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1 text-center text-[11px] font-mono mt-1">
                                      <div className="bg-slate-50 p-1.5 rounded">
                                        <span className="block text-slate-400 text-[9px] scale-90">검사전</span>
                                        <span className="font-semibold text-slate-700">{item.qualityDiff.wmsInspection} / {item.qualityDiff.erpInspection}</span>
                                      </div>
                                      <div className="bg-slate-50 p-1.5 rounded">
                                        <span className="block text-slate-400 text-[9px] scale-90">가용</span>
                                        <span className="font-semibold text-slate-700">{item.qualityDiff.wmsAvailable} / {item.qualityDiff.erpAvailable}</span>
                                      </div>
                                      <div className="bg-slate-50 p-1.5 rounded">
                                        <span className="block text-slate-400 text-[9px] scale-90">보류</span>
                                        <span className="font-semibold text-slate-700">{item.qualityDiff.wmsBlocked} / {item.qualityDiff.erpBlocked}</span>
                                      </div>
                                      <div className="bg-slate-50 p-1.5 rounded">
                                        <span className="block text-slate-400 text-[9px] scale-90">제한</span>
                                        <span className="font-semibold text-slate-700">{item.qualityDiff.wmsRestricted} / {item.qualityDiff.erpRestricted}</span>
                                      </div>
                                    </div>
                                    {hasQualityMismatch && (
                                      <p className="text-[11px] text-red-500 mt-1.5 leading-normal">
                                        ※ 두 시스템 간의 상태 불일치가 존재합니다. 전산 결제 혹은 보류 처리가 한쪽에 누락되었습니다.
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Material Classification */}
                                {item.materialTypeDiff && (
                                  <div className="pt-3 border-t border-slate-100">
                                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                                      <span>자재분류 속성 매핑 (MTS/MTO)</span>
                                      {hasTypeMismatch ? (
                                        <span className="text-amber-600 text-[10px] bg-amber-50 px-1.5 py-0.5 rounded font-bold">분류 불일치</span>
                                      ) : (
                                        <span className="text-slate-400 text-[10px]">일치</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                                      WMS 분류: <span className="font-semibold text-slate-700">{item.materialTypeDiff.wmsType || 'N/A'}</span> {item.materialTypeDiff.wmsOrder ? `(오더: ${item.materialTypeDiff.wmsOrder})` : ''} <br />
                                      ERP 분류: <span className="font-semibold text-slate-700">{item.materialTypeDiff.erpType || 'N/A'}</span> {item.materialTypeDiff.erpOrder ? `(오더: ${item.materialTypeDiff.erpOrder})` : ''}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Panel: Reconciling In-Transit Records */}
                            <div className="lg:col-span-7 space-y-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                🚚 매핑된 이송중재고 세부 상세 내역 ({item.inTransitRecords.length}건)
                              </h4>

                              {item.inTransitRecords.length === 0 ? (
                                <div className="bg-white border border-slate-200/60 rounded-lg p-8 text-center text-slate-400 shadow-xs text-xs">
                                  이 자재 및 LOT로 이송중인 재고가 존재하지 않습니다. <br />
                                  수량 차이 소명 불가능 (실물 수량 과부족 리스크 존재)
                                </div>
                              ) : (
                                <div className="bg-white border border-slate-200/60 rounded-lg overflow-hidden shadow-xs">
                                  <table className="w-full text-xs text-left">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                                        <th className="py-2.5 px-3">송출지 (SLoc)</th>
                                        <th className="py-2.5 px-3">입고지 (SLoc)</th>
                                        <th className="py-2.5 px-3">바코드 일련번호</th>
                                        <th className="py-2.5 px-3 text-right">이송 수량</th>
                                        <th className="py-2.5 px-3 text-center">이송 상태</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600 font-mono">
                                      {item.inTransitRecords.map((it, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                          <td className="py-2 px-3">{it.issuingPlant} / {it.issuingSLoc}</td>
                                          <td className="py-2 px-3">{it.receivingPlant} / {it.receivingSLoc}</td>
                                          <td className="py-2 px-3">{it.serialNo}</td>
                                          <td className="py-2 px-3 text-right font-bold text-slate-800">{it.qty.toLocaleString()} KG</td>
                                          <td className="py-2 px-3 text-center">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-bold">
                                              {it.status1 || '출하완료'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* General System Verdict Comment */}
                              <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-4">
                                <h5 className="text-xs font-bold text-blue-800 flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  통합 판정 코멘트 (System Audit Verdict)
                                </h5>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                                  {item.explanation}
                                </p>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
