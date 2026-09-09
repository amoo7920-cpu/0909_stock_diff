import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Database, 
  Upload, 
  FileSearch, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  FileSpreadsheet,
  Boxes,
  HelpCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { DailyReport, ReconciledItem } from './types';
import { 
  SAMPLE_DATE,
  SAMPLE_RAW_SLOC_QTY,
  SAMPLE_RAW_QUALITY,
  SAMPLE_RAW_MAT_TYPE,
  SAMPLE_RAW_IN_TRANSIT
} from './data/sampleData';
import { 
  parseSLocQuantityText,
  parseQualityStatusText,
  parseMaterialTypeDiffText,
  parseInTransitText
} from './lib/parser';
import { reconcileDailyData } from './lib/reconciliation';

// Import our tabs
import DashboardTab from './components/DashboardTab';
import ReconciliationEngine from './components/ReconciliationEngine';
import ProposalTab from './components/ProposalTab';
import DataUploadTab from './components/DataUploadTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reconciliation' | 'proposal' | 'upload'>('dashboard');
  const [historicalReports, setHistoricalReports] = useState<DailyReport[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(SAMPLE_DATE);

  // Initialize and seed sample data
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const stored = localStorage.getItem('wms_erp_reports');
    let loadedReports: DailyReport[] = [];
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DailyReport[];
        if (parsed.length > 0) {
          loadedReports = parsed;
        }
      } catch (e) {
        console.error('Error parsing stored reports', e);
      }
    }

    if (loadedReports.length === 0) {
      // Seed with 2026-09-08 sample
      const seededReport: DailyReport = {
        date: SAMPLE_DATE,
        slocQtyData: parseSLocQuantityText(SAMPLE_RAW_SLOC_QTY),
        qualityData: parseQualityStatusText(SAMPLE_RAW_QUALITY),
        matTypeData: parseMaterialTypeDiffText(SAMPLE_RAW_MAT_TYPE),
        inTransitData: parseInTransitText(SAMPLE_RAW_IN_TRANSIT),
      };
      loadedReports = [seededReport];
      localStorage.setItem('wms_erp_reports', JSON.stringify(loadedReports));
    }

    setHistoricalReports(loadedReports);

    // If today is not uploaded yet, default to upload screen first as requested
    const hasTodayUpload = loadedReports.some(r => r.date === todayStr);
    if (hasTodayUpload) {
      setActiveTab('dashboard');
      setSelectedDate(todayStr);
    } else {
      setActiveTab('upload');
      const dates = loadedReports.map(r => r.date).sort();
      setSelectedDate(dates[dates.length - 1] || todayStr);
    }
  }, []);

  // Save new report and switch to its date
  const handleSaveReport = (newReport: DailyReport) => {
    // Filter out if same date exists to overwrite
    const updated = historicalReports.filter(r => r.date !== newReport.date);
    const newList = [...updated, newReport].sort((a, b) => a.date.localeCompare(b.date));
    
    setHistoricalReports(newList);
    localStorage.setItem('wms_erp_reports', JSON.stringify(newList));
    setSelectedDate(newReport.date);
    setActiveTab('dashboard'); // Jump to dashboard to see results immediately!
  };

  // Get current active report & reconcile it
  const currentReport = historicalReports.find(r => r.date === selectedDate);
  const reconciledItems: ReconciledItem[] = currentReport 
    ? reconcileDailyData(
        currentReport.slocQtyData,
        currentReport.qualityData,
        currentReport.matTypeData,
        currentReport.inTransitData
      )
    : [];

  // General statistics for current active view
  const unresolvedCount = reconciledItems.filter(i => i.reconciliationStatus === 'UNRESOLVED' && Math.abs(i.netDiff) > 0).length;
  const reconciledCount = reconciledItems.filter(i => i.reconciliationStatus === 'RECONCILED' && Math.abs(i.netDiff) > 0).length;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800" id="app_root">
      
      {/* Upper Navigation Header bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm shadow-blue-500/20">
              <FileSpreadsheet className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 tracking-tight block">WMS-ERP INTEGRATOR</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">재고 정합성 자동 모니터링 시스템</span>
            </div>
          </div>

          {/* Date Selector Dropdown & Quick Actions */}
          <div className="flex items-center gap-4">
            
            {/* Quick Audit Status Pill */}
            {unresolvedCount > 0 ? (
              <span className="hidden md:inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                미결 조정 차이 {unresolvedCount}건 감지됨
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-100">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                모든 재고 정상 소명 완료
              </span>
            )}

            <div className="flex items-center gap-2 border border-slate-200 rounded-lg bg-white px-3 py-1.5 shadow-xs">
              <Clock className="w-4 h-4 text-slate-400" />
              <select 
                className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                {historicalReports.map(report => (
                  <option key={report.date} value={report.date}>
                    조회 일자: {report.date}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </header>

      {/* Primary Container with Navigation Sidebar and Tab Panels */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar Panel */}
        <aside className="md:w-64 shrink-0 flex flex-col gap-6" id="navigation_sidebar">
          
          {/* Main Visual Tabs Selector */}
          <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs space-y-1">
            <span className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">메뉴 네비게이션</span>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4.5 h-4.5" />
              실시간 분석 대시보드
            </button>

            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'reconciliation' 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4.5 h-4.5" />
              재고 차이 원장 조회
            </button>

            <button
              onClick={() => setActiveTab('proposal')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'proposal' 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileSearch className="w-4.5 h-4.5" />
              차이 분석 및 관리 방안
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'upload' 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-4.5 h-4.5" />
              일자별 데이터 전송(업로드)
            </button>
          </div>

          {/* Mini Metadata Information Box */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-xs text-slate-500 leading-normal space-y-2">
            <h4 className="font-bold text-slate-700 flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-blue-600" />
              현재 데이터셋 분석 요약
            </h4>
            <div>
              <strong>조회 대상 일자:</strong> <span className="font-semibold text-slate-700">{selectedDate}</span>
            </div>
            <div>
              <strong>매핑된 차이 품목:</strong> <span className="font-semibold text-slate-700">{reconciledItems.length}개 LOT</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between">
              <span>정합 완료건:</span>
              <span className="font-bold text-green-600">{reconciledCount}건</span>
            </div>
            <div className="flex justify-between">
              <span>미결 분석건:</span>
              <span className="font-bold text-red-600">{unresolvedCount}건</span>
            </div>
          </div>

        </aside>

        {/* Tab View Render Panel */}
        <section className="flex-1 min-w-0" id="main_tab_panel">
          
          {activeTab === 'dashboard' && (
            <DashboardTab items={reconciledItems} selectedDate={selectedDate} />
          )}

          {activeTab === 'reconciliation' && (
            <ReconciliationEngine items={reconciledItems} />
          )}

          {activeTab === 'proposal' && (
            <ProposalTab />
          )}

          {activeTab === 'upload' && (
            <DataUploadTab onSaveReport={handleSaveReport} />
          )}

        </section>

      </main>

      {/* Footer System Credits */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6">
          © 2026 WMS-ERP Inventory Integrator. All Rights Reserved. Designed for Logistics & Warehouse Operation Audits.
        </div>
      </footer>

    </div>
  );
}
