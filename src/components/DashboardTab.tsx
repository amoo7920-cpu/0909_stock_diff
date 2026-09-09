import React, { useState, useEffect } from 'react';
import { ReconciledItem } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Boxes, 
  ShieldAlert, 
  Layers, 
  Info,
  ClipboardList,
  Check,
  X,
  History,
  Save,
  MessageSquare,
  FileText
} from 'lucide-react';

interface DashboardTabProps {
  items: ReconciledItem[];
  selectedDate: string;
}

export default function DashboardTab({ items, selectedDate }: DashboardTabProps) {
  // ==========================================
  // HIERARCHICAL DISCREPANCY PARTITIONING (EXCLUDING SLOC 2900)
  // ==========================================
  
  // Filter out Storage Location (SLoc) 2900 as explicitly requested by user
  const displayItems = items.filter(item => item.sloc !== '2900');

  // Priority 1: SLoc Quantity Difference (WMS Total Qty != ERP Total Qty)
  const qtyDiscrepancies = displayItems.filter(item => Math.abs(item.netDiff) > 0.001);
  const qtyKeys = new Set(qtyDiscrepancies.map(item => item.key));

  // Priority 2: Material Type Difference (Exclude Priority 1)
  const typeDiscrepancies = displayItems.filter(item => {
    if (qtyKeys.has(item.key)) return false;
    if (!item.materialTypeDiff) return false;
    return (
      item.materialTypeDiff.wmsType !== item.materialTypeDiff.erpType ||
      item.materialTypeDiff.wmsOrder !== item.materialTypeDiff.erpOrder
    );
  });
  const typeKeys = new Set(typeDiscrepancies.map(item => item.key));

  // Priority 3: Quality Status Difference (Exclude Priority 1 & 2)
  const qualityDiscrepancies = displayItems.filter(item => {
    if (qtyKeys.has(item.key) || typeKeys.has(item.key)) return false;
    if (!item.qualityDiff) return false;
    return (
      item.qualityDiff.diffInspection !== 0 ||
      item.qualityDiff.diffAvailable !== 0 ||
      item.qualityDiff.diffBlocked !== 0 ||
      item.qualityDiff.diffRestricted !== 0
    );
  });

  // ==========================================
  // DISCREPANCY CAUSE MANAGEMENT (LOCAL STORAGE)
  // ==========================================
  const [reasons, setReasons] = useState<{ [material: string]: { [date: string]: string } }>(() => {
    const stored = localStorage.getItem('wms_erp_material_reasons');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  });

  // Local input values for the reasons form
  const [inputStates, setInputStates] = useState<{ [key: string]: string }>({});
  // Saved feedback visual indicators
  const [savedFeedback, setSavedFeedback] = useState<{ [material: string]: boolean }>({});
  // Selected item key for editing reason/history dropdown
  const [activeReasonKey, setActiveReasonKey] = useState<string | null>(null);

  // Synchronize input fields whenever active date or items change
  useEffect(() => {
    const initialInputs: { [key: string]: string } = {};
    items.forEach(item => {
      const existing = reasons[item.material]?.[selectedDate] || '';
      initialInputs[item.key] = existing;
    });
    setInputStates(initialInputs);
  }, [selectedDate, items, reasons]);

  // Handle saving reason
  const handleSaveReason = (material: string, itemKey: string) => {
    const textValue = inputStates[itemKey] || '';
    const updated = {
      ...reasons,
      [material]: {
        ...(reasons[material] || {}),
        [selectedDate]: textValue
      }
    };
    setReasons(updated);
    localStorage.setItem('wms_erp_material_reasons', JSON.stringify(updated));
    
    // Show visual confirmation
    setSavedFeedback(prev => ({ ...prev, [material]: true }));
    setTimeout(() => {
      setSavedFeedback(prev => ({ ...prev, [material]: false }));
    }, 2000);
  };

  // Retrieve previous causes for the same material (other than currently selected date)
  const getPreviousReasons = (material: string) => {
    const matReasons = reasons[material] || {};
    return Object.entries(matReasons)
      .filter(([date, text]) => date !== selectedDate && typeof text === 'string' && text.trim() !== '')
      .map(([date, text]) => ({ date, text: text as string }))
      .sort((a, b) => b.date.localeCompare(a.date)); // Latest date first
  };

  // Helper to render the inline comment right on the card for quick viewing
  const renderDiscrepancyComment = (item: ReconciledItem) => {
    const todayReason = reasons[item.material]?.[selectedDate] || '';
    const prevCauses = getPreviousReasons(item.material);
    const hasInTransit = item.inTransitRecords && item.inTransitRecords.length > 0;

    let commentText = '';
    let badgeStyle = '';
    let label = '';

    if (todayReason.trim()) {
      label = "금일 사유";
      commentText = todayReason;
      badgeStyle = "bg-blue-50 border-blue-200 text-blue-800";
    } else if (hasInTransit) {
      label = "자동 분석";
      commentText = "이송중 재고";
      badgeStyle = "bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold";
    } else if (prevCauses.length > 0) {
      label = `과거 연동 (${prevCauses[0].date})`;
      commentText = prevCauses[0].text;
      badgeStyle = "bg-amber-50 border-amber-200 text-amber-800";
    } else {
      label = "조치 필요";
      commentText = "사유 미등록";
      badgeStyle = "bg-slate-50 border-slate-100 text-slate-400 italic";
    }

    return (
      <div className={`mt-2 px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 shadow-2xs ${badgeStyle}`}>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-extrabold text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/80 shrink-0 border border-current/10 whitespace-nowrap">
            {label}
          </span>
          <span className="truncate font-semibold text-slate-700">
            {commentText}
          </span>
        </div>
        {hasInTransit && (
          <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full shrink-0 whitespace-nowrap">
            이송중 {item.inTransitRecords[0].qty.toLocaleString()}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard_tab_container">
      
      {/* 4분면 헤더 & 도움말 */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Quadrant Overview
          </span>
          <h2 className="text-base font-bold tracking-tight mt-1">4분면 재고 차이 분석 ({selectedDate})</h2>
          <p className="text-xs text-slate-400 mt-0.5">양사의 차이 내역을 4분면으로 구성하여 핵심 정보(플랜트, 저장위치, 자재, 로트)와 정합 원인을 한눈에 관리합니다.</p>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>각 품목의 사유 아이콘을 클릭하면 세부 원인 원장을 기록하거나 과거 이력을 볼 수 있습니다.</span>
        </div>
      </div>

      {/* =======================================================
          4분면 그리드 (QUADRANT GRID 2x2)
          ======================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="quadrant_discrepancy_grid">
        
        {/* Quadrant 1: 재고수량 차이 (Top-Left) */}
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col h-[520px]">
          <div className="bg-red-50/40 border-b border-slate-100 px-5 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 bg-red-600 text-white font-extrabold text-xs rounded-md flex items-center justify-center">1</span>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">1면: 재고수량 차이</h3>
                <p className="text-[9px] text-slate-400 font-medium">WMS 수량 ≠ ERP 수량</p>
              </div>
            </div>
            <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
              {qtyDiscrepancies.length}건
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
            {qtyDiscrepancies.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-1.5 text-xs">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <span>검출된 재고수량 불일치가 없습니다.</span>
              </div>
            ) : (
              qtyDiscrepancies.map((item) => {
                const isPositive = item.netDiff > 0;
                const prevCauses = getPreviousReasons(item.material);
                const isExpanded = activeReasonKey === item.key;

                return (
                  <div key={item.key} className="pt-3 first:pt-0 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 font-mono">{item.material}</span>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-mono">LOT: {item.lotNo}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                          <span>플랜트: <strong className="text-slate-700">{item.plant}</strong></span>
                          <span>저장위치: <strong className="text-slate-700">{item.sloc || 'N/A'}</strong></span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${isPositive ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                          {item.netDiff > 0 ? '+' : ''}{item.netDiff.toLocaleString()} {item.unit}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => setActiveReasonKey(isExpanded ? null : item.key)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                            isExpanded ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                          }`}
                          title="사유 기입 및 이력 조회"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Always visible discrepancy comment */}
                    {renderDiscrepancyComment(item)}

                    {/* Expandable Reason Input and History Panel */}
                    {isExpanded && (
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-3 animate-fade-in text-[11px]">
                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block">금일 발생 원인 기록 ({selectedDate})</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="원인을 적고 저장하세요..."
                              className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-hidden"
                              value={inputStates[item.key] || ''}
                              onChange={(e) => setInputStates({ ...inputStates, [item.key]: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveReason(item.material, item.key)}
                              className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors"
                            >
                              저장
                            </button>
                          </div>
                          {savedFeedback[item.material] && (
                            <span className="text-[9px] text-green-600 font-bold block">✓ 저장되었습니다.</span>
                          )}
                        </div>

                        <div className="space-y-1 pt-1.5 border-t border-slate-200/60">
                          <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block flex items-center gap-1">
                            <History className="w-3 h-3" /> 이전 동일 자재 원인 이력
                          </span>
                          {prevCauses.length === 0 ? (
                            <div className="text-[9px] text-slate-400 italic">이전 일자의 사유가 없습니다.</div>
                          ) : (
                            <div className="max-h-20 overflow-y-auto space-y-1">
                              {prevCauses.map((hist, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 rounded p-1 text-[9px] text-slate-600 flex justify-between gap-1.5">
                                  <span className="font-semibold shrink-0 text-slate-400">{hist.date}</span>
                                  <span className="text-right text-slate-700 font-medium break-all">{hist.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quadrant 2: 재고 구분 차이 (Top-Right) */}
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col h-[520px]">
          <div className="bg-purple-50/40 border-b border-slate-100 px-5 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 bg-purple-600 text-white font-extrabold text-xs rounded-md flex items-center justify-center">2</span>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">2면: 재고 구분 차이</h3>
                <p className="text-[9px] text-slate-400 font-medium">MTS / MTO / 판매오더 불일치</p>
              </div>
            </div>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
              {typeDiscrepancies.length}건
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
            {typeDiscrepancies.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-1.5 text-xs">
                <CheckCircle2 className="w-8 h-8 text-purple-400" />
                <span>검출된 계획/주문 구분 오차가 없습니다.</span>
              </div>
            ) : (
              typeDiscrepancies.map((item) => {
                const diffRow = item.materialTypeDiff;
                const prevCauses = getPreviousReasons(item.material);
                const isExpanded = activeReasonKey === item.key;

                return (
                  <div key={item.key} className="pt-3 first:pt-0 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 font-mono">{item.material}</span>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-mono">LOT: {item.lotNo}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                          <span>플랜트: <strong className="text-slate-700">{item.plant}</strong></span>
                          <span>저장위치: <strong className="text-slate-700">{item.sloc || 'N/A'}</strong></span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          WMS: {diffRow?.wmsType || 'N/A'} ↔ ERP: {diffRow?.erpType || 'N/A'}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => setActiveReasonKey(isExpanded ? null : item.key)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                            isExpanded ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                          }`}
                          title="사유 기입 및 이력 조회"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Always visible discrepancy comment */}
                    {renderDiscrepancyComment(item)}

                    {/* Expandable Reason Input and History Panel */}
                    {isExpanded && (
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-3 animate-fade-in text-[11px]">
                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block">금일 발생 원인 기록 ({selectedDate})</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="원인을 적고 저장하세요..."
                              className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-hidden"
                              value={inputStates[item.key] || ''}
                              onChange={(e) => setInputStates({ ...inputStates, [item.key]: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveReason(item.material, item.key)}
                              className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors"
                            >
                              저장
                            </button>
                          </div>
                          {savedFeedback[item.material] && (
                            <span className="text-[9px] text-green-600 font-bold block">✓ 저장되었습니다.</span>
                          )}
                        </div>

                        <div className="space-y-1 pt-1.5 border-t border-slate-200/60">
                          <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block flex items-center gap-1">
                            <History className="w-3 h-3" /> 이전 동일 자재 원인 이력
                          </span>
                          {prevCauses.length === 0 ? (
                            <div className="text-[9px] text-slate-400 italic">이전 일자의 사유가 없습니다.</div>
                          ) : (
                            <div className="max-h-20 overflow-y-auto space-y-1">
                              {prevCauses.map((hist, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 rounded p-1 text-[9px] text-slate-600 flex justify-between gap-1.5">
                                  <span className="font-semibold shrink-0 text-slate-400">{hist.date}</span>
                                  <span className="text-right text-slate-700 font-medium break-all">{hist.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quadrant 3: 품질 상태 차이 (Bottom-Left) */}
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col h-[520px]">
          <div className="bg-amber-50/40 border-b border-slate-100 px-5 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 bg-amber-600 text-white font-extrabold text-xs rounded-md flex items-center justify-center">3</span>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">3면: 품질 상태 차이</h3>
                <p className="text-[9px] text-slate-400 font-medium">가용 / 보류 / 검사전 등 품질 오차</p>
              </div>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
              {qualityDiscrepancies.length}건
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
            {qualityDiscrepancies.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-1.5 text-xs">
                <CheckCircle2 className="w-8 h-8 text-amber-500" />
                <span>검출된 품질 상태 구분 불일치가 없습니다.</span>
              </div>
            ) : (
              qualityDiscrepancies.map((item) => {
                const qDiff = item.qualityDiff;
                if (!qDiff) return null;

                const prevCauses = getPreviousReasons(item.material);
                const isExpanded = activeReasonKey === item.key;

                // Compute mismatches details
                const diffText: string[] = [];
                if (qDiff.diffAvailable !== 0) diffText.push(`가용:${qDiff.diffAvailable > 0 ? '+' : ''}${qDiff.diffAvailable.toLocaleString()}`);
                if (qDiff.diffInspection !== 0) diffText.push(`검사전:${qDiff.diffInspection > 0 ? '+' : ''}${qDiff.diffInspection.toLocaleString()}`);
                if (qDiff.diffBlocked !== 0) diffText.push(`보류:${qDiff.diffBlocked > 0 ? '+' : ''}${qDiff.diffBlocked.toLocaleString()}`);
                if (qDiff.diffRestricted !== 0) diffText.push(`제한:${qDiff.diffRestricted > 0 ? '+' : ''}${qDiff.diffRestricted.toLocaleString()}`);

                return (
                  <div key={item.key} className="pt-3 first:pt-0 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 font-mono">{item.material}</span>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-mono">LOT: {item.lotNo}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                          <span>플랜트: <strong className="text-slate-700">{item.plant}</strong></span>
                          <span>저장위치: <strong className="text-slate-700">{item.sloc || 'N/A'}</strong></span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded max-w-[150px] truncate" title={diffText.join(', ')}>
                          {diffText.join(', ')}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => setActiveReasonKey(isExpanded ? null : item.key)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                            isExpanded ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                          }`}
                          title="사유 기입 및 이력 조회"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Always visible discrepancy comment */}
                    {renderDiscrepancyComment(item)}

                    {/* Expandable Reason Input and History Panel */}
                    {isExpanded && (
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-3 animate-fade-in text-[11px]">
                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block">금일 발생 원인 기록 ({selectedDate})</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="원인을 적고 저장하세요..."
                              className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-hidden"
                              value={inputStates[item.key] || ''}
                              onChange={(e) => setInputStates({ ...inputStates, [item.key]: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveReason(item.material, item.key)}
                              className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors"
                            >
                              저장
                            </button>
                          </div>
                          {savedFeedback[item.material] && (
                            <span className="text-[9px] text-green-600 font-bold block">✓ 저장되었습니다.</span>
                          )}
                        </div>

                        <div className="space-y-1 pt-1.5 border-t border-slate-200/60">
                          <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block flex items-center gap-1">
                            <History className="w-3 h-3" /> 이전 동일 자재 원인 이력
                          </span>
                          {prevCauses.length === 0 ? (
                            <div className="text-[9px] text-slate-400 italic">이전 일자의 사유가 없습니다.</div>
                          ) : (
                            <div className="max-h-20 overflow-y-auto space-y-1">
                              {prevCauses.map((hist, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 rounded p-1 text-[9px] text-slate-600 flex justify-between gap-1.5">
                                  <span className="font-semibold shrink-0 text-slate-400">{hist.date}</span>
                                  <span className="text-right text-slate-700 font-medium break-all">{hist.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quadrant 4: 공백 및 설명 카드 (Bottom-Right) */}
        <div className="bg-slate-50 border border-slate-200/60 border-dashed rounded-xl overflow-hidden h-[520px] flex flex-col justify-between p-6">
          <div className="space-y-4">
            <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">4면: (빈 여백 영역)</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                4분면 균형을 지키기 위한 공백 영역입니다. 원하시는 경우 언제든 업무 가이드나 즐겨찾기, 통계 카드 등으로 확장해 드릴 수 있습니다.
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-xl border border-slate-200/30 text-[11px] text-slate-500 leading-relaxed space-y-2.5">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-500" /> WMS-ERP 통합 감사 팁
              </span>
              <p>
                수량 오차가 이송중 자동소명 뱃지로 검출된 경우, ERP에서 Goods Receipt(입고 처리)가 누락되어 WMS에만 실물이 적재되어 있는 상태일 가능성이 높습니다. 담당 전산 입력 상태를 상호 조율하십시오.
              </p>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 border-t border-slate-200/50 pt-4 text-center">
            WMS-ERP INTEGRATION CO., LTD. ALL RIGHTS RESERVED.
          </div>
        </div>

      </div>

    </div>
  );
}
