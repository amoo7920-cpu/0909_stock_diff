import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  Clipboard,
  RefreshCw,
  FolderOpen,
  FileSpreadsheet,
  Info
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
import { DailyReport } from '../types';

interface DataUploadTabProps {
  onSaveReport: (report: DailyReport) => void;
}

export default function DataUploadTab({ onSaveReport }: DataUploadTabProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today in local time
    return new Date().toLocaleDateString('en-CA');
  });
  
  // Text area contents (internal CSV-like formats generated either by copy-paste or excel converter)
  const [slocQtyText, setSlocQtyText] = useState<string>('');
  const [qualityText, setQualityText] = useState<string>('');
  const [matTypeText, setMatTypeText] = useState<string>('');
  const [inTransitText, setInTransitText] = useState<string>('');

  // Local validation counts
  const [validation, setValidation] = useState<{
    slocQtyCount: number | null;
    qualityCount: number | null;
    matTypeCount: number | null;
    inTransitCount: number | null;
  }>({
    slocQtyCount: null,
    qualityCount: null,
    matTypeCount: null,
    inTransitCount: null,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-load sample data for 2026-09-08
  const loadSampleData = () => {
    setSelectedDate('2026-09-08');
    setSlocQtyText(SAMPLE_RAW_SLOC_QTY);
    setQualityText(SAMPLE_RAW_QUALITY);
    setMatTypeText(SAMPLE_RAW_MAT_TYPE);
    setInTransitText(SAMPLE_RAW_IN_TRANSIT);
    
    // Auto-validate loaded samples
    setValidation({
      slocQtyCount: parseSLocQuantityText(SAMPLE_RAW_SLOC_QTY).length,
      qualityCount: parseQualityStatusText(SAMPLE_RAW_QUALITY).length,
      matTypeCount: parseMaterialTypeDiffText(SAMPLE_RAW_MAT_TYPE).length,
      inTransitCount: parseInTransitText(SAMPLE_RAW_IN_TRANSIT).length,
    });
    setErrorMsg(null);
    setSuccessMsg("2026-09-08 일자 실물 샘플 데이터가 성공적으로 로드되었습니다! '데이터 저장 및 재고 분석 실행'을 클릭하여 분석을 시작하세요.");
  };

  // Run quick validation on texts
  const runValidation = () => {
    try {
      const p1 = parseSLocQuantityText(slocQtyText);
      const p2 = parseQualityStatusText(qualityText);
      const p3 = parseMaterialTypeDiffText(matTypeText);
      const p4 = parseInTransitText(inTransitText);

      setValidation({
        slocQtyCount: p1.length,
        qualityCount: p2.length,
        matTypeCount: p3.length,
        inTransitCount: p4.length,
      });

      if (p1.length === 0 && p2.length === 0 && p3.length === 0 && p4.length === 0) {
        setErrorMsg("데이터가 비어 있습니다. 엑셀 파일을 업로드하거나 샘플 데이터를 불러오세요.");
        return false;
      }

      setErrorMsg(null);
      return { p1, p2, p3, p4 };
    } catch (err) {
      console.error(err);
      setErrorMsg("데이터 파싱 중 오류가 발생했습니다. 파일 형식이나 내용을 다시 한 번 확인해주세요.");
      return false;
    }
  };

  // Handle consolidated excel file upload (All 4 sheets in one file)
  const handleConsolidatedExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let matchedSloc = '';
        let matchedQuality = '';
        let matchedMatType = '';
        let matchedTransit = '';
        
        let slocSheetName = '';
        let qualitySheetName = '';
        let matTypeSheetName = '';
        let transitSheetName = '';

        workbook.SheetNames.forEach(sheetName => {
          const lower = sheetName.toLowerCase();
          if (lower.includes('수량') || lower.includes('위치') || lower.includes('qty') || lower.includes('sloc') || lower.includes('저장')) {
            matchedSloc = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName], { FS: ',' });
            slocSheetName = sheetName;
          } else if (lower.includes('상태') || lower.includes('품질') || lower.includes('quality') || lower.includes('status')) {
            matchedQuality = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName], { FS: ',' });
            qualitySheetName = sheetName;
          } else if (lower.includes('구분') || lower.includes('자재') || lower.includes('type') || lower.includes('mto') || lower.includes('mts')) {
            matchedMatType = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName], { FS: ',' });
            matTypeSheetName = sheetName;
          } else if (lower.includes('이송') || lower.includes('transit') || lower.includes('transit_qty') || lower.includes('delivery')) {
            matchedTransit = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName], { FS: ',' });
            transitSheetName = sheetName;
          }
        });

        // Fallback by Index if names don't match
        if (!matchedSloc && workbook.SheetNames[0]) {
          matchedSloc = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]], { FS: ',' });
          slocSheetName = workbook.SheetNames[0];
        }
        if (!matchedQuality && workbook.SheetNames[1]) {
          matchedQuality = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[1]], { FS: ',' });
          qualitySheetName = workbook.SheetNames[1];
        }
        if (!matchedMatType && workbook.SheetNames[2]) {
          matchedMatType = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[2]], { FS: ',' });
          matTypeSheetName = workbook.SheetNames[2];
        }
        if (!matchedTransit && workbook.SheetNames[3]) {
          matchedTransit = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[3]], { FS: ',' });
          transitSheetName = workbook.SheetNames[3];
        }

        // Set text contents
        if (matchedSloc) setSlocQtyText(matchedSloc);
        if (matchedQuality) setQualityText(matchedQuality);
        if (matchedMatType) setMatTypeText(matchedMatType);
        if (matchedTransit) setInTransitText(matchedTransit);

        // Pre-validate parsed sheets
        const p1 = matchedSloc ? parseSLocQuantityText(matchedSloc) : [];
        const p2 = matchedQuality ? parseQualityStatusText(matchedQuality) : [];
        const p3 = matchedMatType ? parseMaterialTypeDiffText(matchedMatType) : [];
        const p4 = matchedTransit ? parseInTransitText(matchedTransit) : [];

        setValidation({
          slocQtyCount: p1.length,
          qualityCount: p2.length,
          matTypeCount: p3.length,
          inTransitCount: p4.length,
        });

        setSuccessMsg(
          `🎉 통합 엑셀 파일 업로드 및 자동 매핑 성공!\n\n` +
          `• 1. 재고수량 차이: '${slocSheetName}' 시트 매칭 (${p1.length}개 행 검출)\n` +
          `• 2. 재고구분 차이: '${matTypeSheetName}' 시트 매칭 (${p3.length}개 행 검출)\n` +
          `• 3. 품질상태 차이: '${qualitySheetName}' 시트 매칭 (${p2.length}개 행 검출)\n` +
          `• 4. 이송중 재고: '${transitSheetName}' 시트 매칭 (${p4.length}개 행 검출)\n\n` +
          `하단의 '데이터 저장 및 재고 분석 실행' 단추를 눌러주시면 최종 정합성 연산이 가동됩니다.`
        );
        setErrorMsg(null);
      } catch (err) {
        console.error(err);
        setErrorMsg("통합 엑셀 파일을 읽는 과정에서 오류가 발생했습니다. 올바른 통합 엑셀 문서 파일인지 확인해 주세요.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle individual files (either excel .xlsx/.xls or CSV/TXT)
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    type: 'sloc' | 'quality' | 'mattype' | 'transit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const text = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName], { FS: ',' });
          setter(text);
          
          if (type === 'sloc') {
            setValidation(prev => ({ ...prev, slocQtyCount: parseSLocQuantityText(text).length }));
          } else if (type === 'quality') {
            setValidation(prev => ({ ...prev, qualityCount: parseQualityStatusText(text).length }));
          } else if (type === 'mattype') {
            setValidation(prev => ({ ...prev, matTypeCount: parseMaterialTypeDiffText(text).length }));
          } else if (type === 'transit') {
            setValidation(prev => ({ ...prev, inTransitCount: parseInTransitText(text).length }));
          }
          setSuccessMsg(`개별 엑셀 파일 '${file.name}' 파싱 성공!`);
          setErrorMsg(null);
        } catch {
          setErrorMsg("개별 엑셀 파일 파싱에 실패했습니다.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV or plain text
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setter(text);
        
        try {
          if (type === 'sloc') {
            setValidation(prev => ({ ...prev, slocQtyCount: parseSLocQuantityText(text).length }));
          } else if (type === 'quality') {
            setValidation(prev => ({ ...prev, qualityCount: parseQualityStatusText(text).length }));
          } else if (type === 'mattype') {
            setValidation(prev => ({ ...prev, matTypeCount: parseMaterialTypeDiffText(text).length }));
          } else if (type === 'transit') {
            setValidation(prev => ({ ...prev, inTransitCount: parseInTransitText(text).length }));
          }
          setSuccessMsg(`개별 텍스트/CSV 파일 '${file.name}' 파싱 완료!`);
          setErrorMsg(null);
        } catch {
          setErrorMsg("파일 파싱에 실패했습니다. 형식 또는 구분 기호를 확인해 주세요.");
        }
      };
      reader.readAsText(file, "EUC-KR");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = runValidation();
    if (!parsed) return;

    const report: DailyReport = {
      date: selectedDate,
      slocQtyData: parsed.p1,
      qualityData: parsed.p2,
      matTypeData: parsed.p3,
      inTransitData: parsed.p4,
    };

    onSaveReport(report);
    setSuccessMsg(`${selectedDate} 일자의 재고 차이 데이터가 성공적으로 분석 대시보드에 적용되었습니다!`);
    
    // Clear state
    setSlocQtyText('');
    setQualityText('');
    setMatTypeText('');
    setInTransitText('');
    setValidation({
      slocQtyCount: null,
      qualityCount: null,
      matTypeCount: null,
      inTransitCount: null,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="data_upload_tab_container">
      
      {/* Visual Welcome Notification */}
      <div className="bg-blue-600 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 bg-blue-500 text-blue-100 text-[10px] font-bold rounded-full tracking-wider uppercase">
            WMS-ERP INTEGRATOR UPLOAD PORTAL
          </span>
          <h1 className="text-xl font-bold tracking-tight">일자별 엑셀 원본 파일 업로드 및 정합 가동</h1>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            WMS와 ERP에서 산출된 엑셀 보고서 파일을 단 한 번 업로드함으로써 모든 수량 차이, 자재구분 차이, 품질 상태 차이를 매핑하고 이송중 재고와의 자동 소명 엔진을 즉시 구동시킵니다.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSampleData}
          className="shrink-0 bg-white hover:bg-slate-50 text-blue-700 font-bold text-xs px-4 py-2.5 rounded-lg border border-transparent shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          실제 샘플 데이터 즉시 불러오기 (2026-09-08)
        </button>
      </div>

      {/* Alert Panels */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-xl flex items-start gap-3 text-sm shadow-sm whitespace-pre-line">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="font-medium">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-xl flex items-start gap-3 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {/* 1. Recommended Consolidated Excel Upload Portal */}
      <div className="bg-white border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-xl p-8 shadow-xs text-center transition-all">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">[추천] 통합 엑셀 파일 한 번에 업로드</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              4개의 시트(수량, 상태, 구분, 이송중)가 모두 담긴 엑셀 통합 문서 파일(*.xlsx, *.xls)을 등록하세요. 시트 이름을 자동으로 파싱해 한 번에 매핑해 드립니다.
            </p>
          </div>
          <div>
            <input
              type="file"
              id="consolidated-excel"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleConsolidatedExcel}
            />
            <label 
              htmlFor="consolidated-excel" 
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              통합 엑셀 파일 선택하기
            </label>
          </div>
          <div className="text-[10px] text-slate-400">
            지원하는 시트명 키워드: 수량/위치(SLoc), 상태/품질(Quality), 구분/자재(Type), 이송(Transit)
          </div>
        </div>
      </div>

      {/* Main Form and Action Section (For Individual Uploads or Manual CSV fallbacks) */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-6">
        
        {/* Date and Custom Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">개별 파일 업로드 및 텍스트 데이터 보정</h2>
            <p className="text-xs text-slate-500 mt-0.5">통합 업로드 대신 개별 엑셀/CSV 보고서 파일을 등록하거나 원문 텍스트를 붙여넣을 수도 있습니다.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs shrink-0 self-start sm:self-center">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-500 mr-1">보고서 적용 일자:</span>
            <input
              type="date"
              required
              className="bg-transparent border-0 text-xs text-slate-700 focus:outline-hidden font-bold cursor-pointer"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Upload Textareas Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* File 1: SLoc Quantity Diff */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                1. 재고수량 차이 (저장위치 비교)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-sloc"
                  accept=".xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setSlocQtyText, 'sloc')}
                />
                <label 
                  htmlFor="file-sloc" 
                  className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                >
                  <FolderOpen className="w-3 h-3" /> 파일 등록
                </label>
                {validation.slocQtyCount !== null && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    {validation.slocQtyCount}개 행 검출
                  </span>
                )}
              </div>
            </div>
            <textarea
              placeholder="엑셀 시트 또는 CSV 원천 텍스트를 붙여넣으세요 (클립보드 복사 내용 자동 호환)"
              className="w-full h-32 bg-slate-50/30 hover:bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              value={slocQtyText}
              onChange={(e) => setSlocQtyText(e.target.value)}
            />
          </div>

          {/* File 2: Material Type Diff */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                2. 재고 구분 차이 (자재구분 비교)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-mattype"
                  accept=".xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setMatTypeText, 'mattype')}
                />
                <label 
                  htmlFor="file-mattype" 
                  className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                >
                  <FolderOpen className="w-3 h-3" /> 파일 등록
                </label>
                {validation.matTypeCount !== null && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    {validation.matTypeCount}개 행 검출
                  </span>
                )}
              </div>
            </div>
            <textarea
              placeholder="엑셀 시트 또는 CSV 원천 텍스트를 붙여넣으세요 (클립보드 복사 내용 자동 호환)"
              className="w-full h-32 bg-slate-50/30 hover:bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              value={matTypeText}
              onChange={(e) => setMatTypeText(e.target.value)}
            />
          </div>

          {/* File 3: Quality Status Diff */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                3. 재고 품질상태 차이 (품질상태 비교)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-quality"
                  accept=".xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setQualityText, 'quality')}
                />
                <label 
                  htmlFor="file-quality" 
                  className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                >
                  <FolderOpen className="w-3 h-3" /> 파일 등록
                </label>
                {validation.qualityCount !== null && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    {validation.qualityCount}개 행 검출
                  </span>
                )}
              </div>
            </div>
            <textarea
              placeholder="엑셀 시트 또는 CSV 원천 텍스트를 붙여넣으세요 (클립보드 복사 내용 자동 호환)"
              className="w-full h-32 bg-slate-50/30 hover:bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              value={qualityText}
              onChange={(e) => setQualityText(e.target.value)}
            />
          </div>

          {/* File 4: In-Transit Inventory */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                4. 이송중 재고 원장 (원인 추적용)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-transit"
                  accept=".xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setInTransitText, 'transit')}
                />
                <label 
                  htmlFor="file-transit" 
                  className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                >
                  <FolderOpen className="w-3 h-3" /> 파일 등록
                </label>
                {validation.inTransitCount !== null && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    {validation.inTransitCount}개 행 검출
                  </span>
                )}
              </div>
            </div>
            <textarea
              placeholder="엑셀 시트 또는 CSV 원천 텍스트를 붙여넣으세요 (클립보드 복사 내용 자동 호환)"
              className="w-full h-32 bg-slate-50/30 hover:bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              value={inTransitText}
              onChange={(e) => setInTransitText(e.target.value)}
            />
          </div>

        </div>

        {/* Action Button Section */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={runValidation}
            className="px-4 py-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors"
          >
            데이터 유효성 빠른 정합 진단
          </button>
          
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-lg text-xs shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            데이터 저장 및 재고 분석 실행
          </button>
        </div>

      </form>
      
      {/* Dynamic Tip Box */}
      <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 text-xs text-slate-500 leading-relaxed flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <strong>💡 시스템 파싱 처리 안내:</strong> 통합 엑셀 파일 업로드 기능은 업무 속도를 비약적으로 단축시켜줍니다. 
          WMS나 ERP에서 내려받은 원본 엑셀 파일을 그대로 지정하시면 본 시스템이 데이터 영역만 똑똑하게 읽어내어 공백과 병합 셀, 한글 문자가 포함된 행을 스마트하게 필터링합니다. 
          결산일이 지난 이력은 상단의 '보고서 적용 일자'를 지정하여 저장해 이력 추적을 유지할 수 있습니다.
        </div>
      </div>

    </div>
  );
}
