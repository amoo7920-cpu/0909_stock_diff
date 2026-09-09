import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  FolderOpen, 
  FileSpreadsheet, 
  Info,
  RefreshCw,
  Trash2,
  FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  SAMPLE_RAW_SLOC_QTY, 
  SAMPLE_RAW_QUALITY, 
  SAMPLE_RAW_MAT_TYPE, 
  SAMPLE_RAW_IN_TRANSIT 
} from '../data/sampleData';
import { 
  parseSLocQuantityText, 
  parseQualityStatusText, 
  parseMaterialTypeDiffText, 
  parseInTransitText 
} from '../lib/parser';
import { DailyReport, SLocQuantityDiff, QualityStatusDiff, MaterialTypeDiff, InTransitInventory } from '../types';

interface DataUploadTabProps {
  onSaveReport: (report: DailyReport) => void;
}

export default function DataUploadTab({ onSaveReport }: DataUploadTabProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-CA');
  });
  
  // Structured parsed data array states
  const [slocQtyData, setSlocQtyData] = useState<SLocQuantityDiff[]>([]);
  const [qualityData, setQualityData] = useState<QualityStatusDiff[]>([]);
  const [matTypeData, setMatTypeData] = useState<MaterialTypeDiff[]>([]);
  const [inTransitData, setInTransitData] = useState<InTransitInventory[]>([]);

  // Files state to track upload metadata
  const [slocFile, setSlocFile] = useState<string | null>(null);
  const [qualityFile, setQualityFile] = useState<string | null>(null);
  const [matTypeFile, setMatTypeFile] = useState<string | null>(null);
  const [inTransitFile, setInTransitFile] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-load sample data for 2026-09-08 as 4 files
  const loadSampleData = () => {
    setSelectedDate('2026-09-08');
    
    const p1 = parseSLocQuantityText(SAMPLE_RAW_SLOC_QTY);
    const p2 = parseQualityStatusText(SAMPLE_RAW_QUALITY);
    const p3 = parseMaterialTypeDiffText(SAMPLE_RAW_MAT_TYPE);
    const p4 = parseInTransitText(SAMPLE_RAW_IN_TRANSIT);

    setSlocQtyData(p1);
    setQualityData(p2);
    setMatTypeData(p3);
    setInTransitData(p4);

    setSlocFile('20260908_ERP재고비교_저장위치.xlsx');
    setMatTypeFile('20260908_ERP재고비교_자재구분.xlsx');
    setQualityFile('20260908_ERP재고비교_재고상태.xlsx');
    setInTransitFile('20260908_ERP재고비교_이송중재고.xlsx');

    setSuccessMsg("2026-09-08 일자 정밀 샘플 데이터 4개가 엑셀 파일 업로드 완료 형태로 로드되었습니다! 하단의 '데이터 저장 및 분석 가동'을 눌러주세요.");
    setErrorMsg(null);
  };

  // Helper to parse file
  const parseUploadedFile = (file: File, type: 'sloc' | 'quality' | 'mattype' | 'transit') => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        let csvText = '';
        if (isExcel) {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          csvText = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName], { FS: ',' });
        } else {
          csvText = event.target?.result as string;
        }

        if (type === 'sloc') {
          const parsed = parseSLocQuantityText(csvText);
          setSlocQtyData(parsed);
          setSlocFile(file.name);
        } else if (type === 'quality') {
          const parsed = parseQualityStatusText(csvText);
          setQualityData(parsed);
          setQualityFile(file.name);
        } else if (type === 'mattype') {
          const parsed = parseMaterialTypeDiffText(csvText);
          setMatTypeData(parsed);
          setMatTypeFile(file.name);
        } else if (type === 'transit') {
          const parsed = parseInTransitText(csvText);
          setInTransitData(parsed);
          setInTransitFile(file.name);
        }
        
        setSuccessMsg(`'${file.name}' 엑셀 분석 및 파싱에 성공했습니다.`);
        setErrorMsg(null);
      } catch (err) {
        console.error(err);
        setErrorMsg(`'${file.name}' 파일 파싱 중 오류가 발생했습니다. 올바른 보고서 양식인지 확인하세요.`);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, "EUC-KR");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'sloc' | 'quality' | 'mattype' | 'transit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseUploadedFile(file, type);
  };

  const handleResetFile = (type: 'sloc' | 'quality' | 'mattype' | 'transit') => {
    if (type === 'sloc') {
      setSlocQtyData([]);
      setSlocFile(null);
    } else if (type === 'quality') {
      setQualityData([]);
      setQualityFile(null);
    } else if (type === 'mattype') {
      setMatTypeData([]);
      setMatTypeFile(null);
    } else if (type === 'transit') {
      setInTransitData([]);
      setInTransitFile(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (slocQtyData.length === 0 && qualityData.length === 0 && matTypeData.length === 0 && inTransitData.length === 0) {
      setErrorMsg("최소 한 개 이상의 엑셀 보고서 파일을 등록해야 합니다.");
      return;
    }

    const report: DailyReport = {
      date: selectedDate,
      slocQtyData,
      qualityData,
      matTypeData,
      inTransitData,
    };

    onSaveReport(report);
    setSuccessMsg(`${selectedDate} 일자의 4개 대조 데이터 분석 및 조정이 완료되어 메인 대시보드에 적용되었습니다!`);
    
    // Clear state
    setSlocQtyData([]);
    setQualityData([]);
    setMatTypeData([]);
    setInTransitData([]);
    setSlocFile(null);
    setQualityFile(null);
    setMatTypeFile(null);
    setInTransitFile(null);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="data_upload_tab_container">
      
      {/* Upper Navigation Header */}
      <div className="bg-blue-600 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 bg-blue-500 text-blue-100 text-[10px] font-bold rounded-full tracking-wider uppercase">
            WMS-ERP Multi-File Portal
          </span>
          <h1 className="text-xl font-bold tracking-tight">4개 엑셀 보고서 개별 파일 업로드 창</h1>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            WMS와 ERP에서 내려받은 4종류의 Excel 보고서 파일을 각 위치에 올바르게 드래그 혹은 클릭하여 간편하게 등록해 주십시오.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSampleData}
          className="shrink-0 bg-white hover:bg-slate-50 text-blue-700 font-bold text-xs px-4 py-2.5 rounded-lg border border-transparent shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          샘플 데이터 원형 한번에 입력 (2026-09-08)
        </button>
      </div>

      {/* Alert Notifications */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4.5 rounded-xl flex items-start gap-3 text-sm shadow-sm whitespace-pre-line">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="font-medium">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4.5 rounded-xl flex items-start gap-3 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Date Select Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-800">보고서 적용 일자 지정</h2>
          <p className="text-xs text-slate-400 mt-0.5">업로드하는 엑셀 원본 데이터가 대조될 적용 기준 일자를 선택하세요.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 shrink-0 self-start sm:self-center">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-500 mr-1">대조 일자:</span>
          <input
            type="date"
            required
            className="bg-transparent border-0 text-xs text-slate-700 focus:outline-hidden font-bold cursor-pointer"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* 4분면 엑셀 업로드 영역 (4-File Quadrant Upload Cards) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: 재고수량 차이 (저장위치) */}
          <div className={`border-2 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all h-64 ${
            slocFile 
              ? 'bg-green-50/50 border-green-300' 
              : 'bg-white border-dashed border-slate-200 hover:border-blue-400'
          }`}>
            {slocFile ? (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. 재고수량 차이</h4>
                  <p className="text-xs font-extrabold text-slate-800 mt-1 truncate max-w-[280px]">{slocFile}</p>
                  <span className="inline-block bg-green-100 text-green-800 text-[10px] font-extrabold px-2 py-0.5 rounded mt-2">
                    {slocQtyData.length}개 행 검출 완료
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetFile('sloc')}
                  className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 mx-auto pt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 다시 올리기
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">1. 재고수량 차이 (저장위치)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">ERP재고비교_저장위치 엑셀 업로드</p>
                </div>
                <input
                  type="file"
                  id="excel-sloc"
                  accept=".xlsx, .xls, .csv, .txt"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'sloc')}
                />
                <label
                  htmlFor="excel-sloc"
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  <FolderOpen className="w-4 h-4" /> 엑셀 파일 선택
                </label>
              </div>
            )}
          </div>

          {/* Card 2: 재고 구분 차이 (자재구분) */}
          <div className={`border-2 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all h-64 ${
            matTypeFile 
              ? 'bg-green-50/50 border-green-300' 
              : 'bg-white border-dashed border-slate-200 hover:border-blue-400'
          }`}>
            {matTypeFile ? (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. 재고 구분 차이</h4>
                  <p className="text-xs font-extrabold text-slate-800 mt-1 truncate max-w-[280px]">{matTypeFile}</p>
                  <span className="inline-block bg-green-100 text-green-800 text-[10px] font-extrabold px-2 py-0.5 rounded mt-2">
                    {matTypeData.length}개 행 검출 완료
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetFile('mattype')}
                  className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 mx-auto pt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 다시 올리기
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">2. 재고 구분 차이 (자재구분)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">ERP재고비교_자재구분 엑셀 업로드</p>
                </div>
                <input
                  type="file"
                  id="excel-mattype"
                  accept=".xlsx, .xls, .csv, .txt"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'mattype')}
                />
                <label
                  htmlFor="excel-mattype"
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  <FolderOpen className="w-4 h-4" /> 엑셀 파일 선택
                </label>
              </div>
            )}
          </div>

          {/* Card 3: 재고 품질상태 차이 (품질상태) */}
          <div className={`border-2 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all h-64 ${
            qualityFile 
              ? 'bg-green-50/50 border-green-300' 
              : 'bg-white border-dashed border-slate-200 hover:border-blue-400'
          }`}>
            {qualityFile ? (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. 품질 상태 차이</h4>
                  <p className="text-xs font-extrabold text-slate-800 mt-1 truncate max-w-[280px]">{qualityFile}</p>
                  <span className="inline-block bg-green-100 text-green-800 text-[10px] font-extrabold px-2 py-0.5 rounded mt-2">
                    {qualityData.length}개 행 검출 완료
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetFile('quality')}
                  className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 mx-auto pt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 다시 올리기
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">3. 품질 상태 차이 (재고상태)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">ERP재고비교_재고상태 엑셀 업로드</p>
                </div>
                <input
                  type="file"
                  id="excel-quality"
                  accept=".xlsx, .xls, .csv, .txt"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'quality')}
                />
                <label
                  htmlFor="excel-quality"
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  <FolderOpen className="w-4 h-4" /> 엑셀 파일 선택
                </label>
              </div>
            )}
          </div>

          {/* Card 4: 이송중 재고 원장 (원인 추적용) */}
          <div className={`border-2 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all h-64 ${
            inTransitFile 
              ? 'bg-green-50/50 border-green-300' 
              : 'bg-white border-dashed border-slate-200 hover:border-blue-400'
          }`}>
            {inTransitFile ? (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">4. 이송중 재고 원장</h4>
                  <p className="text-xs font-extrabold text-slate-800 mt-1 truncate max-w-[280px]">{inTransitFile}</p>
                  <span className="inline-block bg-green-100 text-green-800 text-[10px] font-extrabold px-2 py-0.5 rounded mt-2">
                    {inTransitData.length}개 행 검출 완료
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetFile('transit')}
                  className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 mx-auto pt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 다시 올리기
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">4. 이송중 재고 원장 (원인 소명)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">ERP재고비교_이송중재고 엑셀 업로드</p>
                </div>
                <input
                  type="file"
                  id="excel-transit"
                  accept=".xlsx, .xls, .csv, .txt"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'transit')}
                />
                <label
                  htmlFor="excel-transit"
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  <FolderOpen className="w-4 h-4" /> 엑셀 파일 선택
                </label>
              </div>
            )}
          </div>

        </div>

        {/* Submit action */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-7 py-3 rounded-xl text-sm shadow-md transition-colors"
          >
            <Upload className="w-4 h-4" />
            데이터 저장 및 4분면 대시보드 가동
          </button>
        </div>
      </form>

      {/* Info Tipbox */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>💡 개별 보고서 업로드 팁:</strong> WMS와 ERP 비교를 담당하는 4가지 엑셀 보고서(`*.xlsx`, `*.xls`, `*.csv`)를 각각 해당하는 구역에 하나씩 지정하여 넣어주십시오. 
          업로드가 완료되면 초록색 카드로 전향되며 파싱된 총 행 수가 출력됩니다. 원본 파일 형태 그대로 안전하게 등록해 주시면 데이터 가공 필터링은 시스템이 자동으로 처리합니다.
        </div>
      </div>

    </div>
  );
}
