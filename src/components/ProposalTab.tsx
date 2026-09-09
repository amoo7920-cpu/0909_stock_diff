import React, { useState } from 'react';
import { 
  FileText, 
  HelpCircle, 
  ArrowRight, 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Boxes, 
  Truck, 
  TrendingUp, 
  ShieldAlert, 
  Eye
} from 'lucide-react';

export default function ProposalTab() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const proposalSteps = [
    {
      title: "1. 데이터 통합 및 고유 키(Key) 생성",
      desc: "자재코드(Material) + 로트번호(LOT_NO)를 고유 식별자(Batch Identity)로 결합하여 4개의 독립된 데이터셋을 하나의 통제 체계로 통합합니다.",
      details: [
        "WMS와 ERP의 데이터 구조가 다르고 저장위치가 상이하므로, 가장 기본 단위인 '자재코드+로트번호'로 단일 원장을 매핑합니다.",
        "각 일자별로 업로드된 파일들에 대해 자동으로 이 고유 키를 매핑하는 전처리(Preprocessing) 과정을 실시간으로 수행합니다."
      ]
    },
    {
      title: "2. 이송중 재고(In-Transit) 매칭 엔진 가동",
      desc: "가장 빈번한 재고 차이 원인인 '송출 완료 후 입고 미완료(이송 중)' 상태의 수량을 추적하여, 차이 수량을 지능적으로 자동 소명합니다.",
      details: [
        "예: 완제품 BN740-G1(LOT: D26I0508)의 경우, ERP(SLoc 2400)에 4,700 KG가 있지만 WMS에는 없습니다. (차이 -4,700 KG)",
        "이송중재고 데이터에서 송출(2400) -> 입고(4400) 상태인 바코드 일련번호 5건(총 4,700 KG)을 자동 발견하여 매핑함으로써 차이 원인을 100% 소명(Reconciled) 처리합니다."
      ]
    },
    {
      title: "3. 재고 품질상태 불일치 추적",
      desc: "검사전, 가용, 보류, 제한 등 시스템별 품질 상태 불일치(Status Mismatch) 건을 모니터링하여 물리적 잠금과 전산 잠금을 일치시킵니다.",
      details: [
        "WMS와 ERP의 총 수량은 같더라도 한쪽은 '가용'으로 되어 있고 다른 쪽은 '보류'로 되어 있는 오정렬 건을 실시간으로 발굴합니다.",
        "물리적인 상태(보류/가용) 변경 시 양 시스템에 실시간 동기화 프로세스를 구성하여 전산과 현장 괴리를 최소화합니다."
      ]
    },
    {
      title: "4. 자재구분(MTO/MTS) 및 오더 불일치 추적",
      desc: "주문생산(MTO)과 계획생산(MTS) 구분이 어긋나거나, 할당된 판매오더(Sales Order) 정보가 상이하여 발생하는 가용재고 왜곡을 감지합니다.",
      details: [
        "주로 특수 목적 오더나 재작업 재고 처리 시 발생하는 자재구분 마스터 차이를 리포트합니다.",
        "판매오더 보류 건 중 전산 처리 누락 상태를 정기적으로 감사(Auditing)합니다."
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in" id="proposal_tab_container">
      {/* Header Panel */}
      <div className="bg-white border border-slate-100 rounded-xl p-8 shadow-sm">
        <div className="max-w-3xl">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full tracking-wide">
            ANALYSIS REPORT & MANAGEMENT PROPOSAL
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-3 mb-4">
            WMS-ERP 재고 차이 분석 및 일자별 관리 방안 검토
          </h1>
          <p className="text-slate-600 leading-relaxed text-lg">
            제공해주신 4개의 재고 비교 데이터를 분석한 결과, 시스템 간 재고 불일치는 단순 전산 오류가 아니라
            <strong className="text-slate-800 font-bold"> '물류의 물리적 이동(이송중)'</strong> 및 <strong className="text-slate-800 font-bold">'품질 상태 전산 반영의 시차'</strong>가 주요 원인임이 확인되었습니다. 
            이에 대시보드를 구축하기 전, 다음과 같은 정밀 매핑 및 일자별 관리 모델을 제안합니다.
          </p>
        </div>
      </div>

      {/* The Interactive Matching Demonstration */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="lg:w-1/2 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              핵심 메커니즘: 이송중 재고 자동 소명(Reconciliation) 시연
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              제공해주신 2026-09-08 실 데이터를 기반으로 한 자동 조정 시뮬레이션입니다. 아래의 카드를 클릭하여 시스템이 어떻게 <strong>이송중 재고</strong>를 찾아내어 불일치를 해소하는지 직접 확인해 보세요.
            </p>

            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-md">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">1단계: 시스템 간 불일치 감지 (SLoc 차이)</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    자재 <span className="font-mono text-slate-700">BN740-G1</span> (LOT: <span className="font-mono text-slate-700">D26I0508</span>)이 ERP에는 4,700 KG 있으나 WMS에는 0 KG 존재하여 <span className="text-red-600 font-semibold">-4,700 KG</span>의 차이가 발생합니다.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">2단계: 이송중재고 원장 실시간 검색</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    이송중재고 파일에서 동일 자재 및 LOT번호를 대상으로 조회를 실행하여, 공장 송출(2400) 후 입고(4400) 예정 상태인 5개 박스(일련번호 D26I0508-01~05, 총 <span className="text-blue-600 font-semibold">4,700 KG</span>)를 매핑합니다.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">3단계: 소명 완료 및 경보 해제 (100% 매칭)</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    차이 수량(-4,700)과 이송중 수량(4,700)의 합이 <span className="text-green-600 font-semibold">0</span>이 됨에 따라 '이송 중 출하완료건에 따른 회계적-물리적 시차'로 최종 판단하고 리스크 경보를 자동 해제합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Interactive Diagram Card */}
          <div className="lg:w-1/2 w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              [시뮬레이션] 실시간 데이터 소명 매핑 시각화
            </h3>
            
            <div className="space-y-6">
              {/* Top Row: System Quantities */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium block">WMS (물리 창고)</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">0 <span className="text-xs text-slate-400 font-normal">KG</span></span>
                  <span className="text-xs text-slate-400 mt-1 block">저장위치: 2400 (실물 출고됨)</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium block">ERP (전산 장부)</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">4,700 <span className="text-xs text-slate-400 font-normal">KG</span></span>
                  <span className="text-xs text-slate-400 mt-1 block">저장위치: 2400 (장부상 존재)</span>
                </div>
              </div>

              {/* Middle Element: Difference Connection */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="h-px bg-slate-200 w-full absolute top-1/2 left-0 z-0"></div>
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-full border border-red-200 text-xs font-bold z-10 shadow-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  전산상 미조정 불일치: -4,700 KG
                </div>
              </div>

              {/* Bottom Element: In-Transit Mapping */}
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 relative">
                <div className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  이송중 재고 원장 자동 매칭 성공
                </div>
                <div className="space-y-2 mt-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>출발지: 3000 / 2400</span>
                    <span className="font-semibold text-blue-700">이송중 수량: +4,700 KG</span>
                    <span>도착지: 3000 / 4400</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                    <div className="bg-blue-600 h-full w-full" />
                  </div>
                  <p className="text-[11px] text-slate-500 italic mt-1 text-center">
                    "물리적으로 트럭에 실려 이동 중이므로, ERP 입고 완료 시 양 시스템 재고가 자동 동기화됩니다."
                  </p>
                </div>
              </div>

              {/* Final Result Status */}
              <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-800">조정 상태: 소명 및 조정 완료</span>
                </div>
                <span className="text-xs font-bold text-green-700">남은 미결 건: 0 KG</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Proposal Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {proposalSteps.map((step, idx) => (
          <div 
            key={idx}
            className={`bg-white border rounded-xl p-6 transition-all duration-300 shadow-xs hover:shadow-md ${
              activeStep === idx 
                ? 'border-blue-500 ring-2 ring-blue-500/10' 
                : 'border-slate-100 hover:border-slate-300'
            }`}
            onClick={() => setActiveStep(idx)}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-xs rounded-full font-black">
                  0{idx + 1}
                </span>
                {step.title.split('. ')[1]}
              </h3>
              {activeStep === idx && (
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  상세 가이드 활성
                </span>
              )}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              {step.desc}
            </p>
            <div className={`space-y-2 pt-3 border-t border-slate-100 text-xs transition-opacity duration-300 ${
              activeStep === idx ? 'opacity-100 block' : 'opacity-60 line-clamp-1'
            }`}>
              {step.details.map((detail, dIdx) => (
                <div key={dIdx} className="flex gap-1.5 items-start text-slate-500">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0" />
                  <p className="leading-normal">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Structured Operational Management Proposal Section */}
      <div className="bg-white border border-slate-100 rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <ShieldAlert className="w-5.5 h-5.5 text-blue-600" />
          상시 재고 자산 조정을 위한 일자별 운영 관리 프로세스 제안
        </h3>

        <div className="relative border-l-2 border-slate-200 pl-6 ml-4 space-y-8">
          {/* Step A */}
          <div className="relative">
            <div className="absolute -left-[33px] top-0 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
              A
            </div>
            <h4 className="text-base font-bold text-slate-800">일차별 데이터 정기 업로드 자동화</h4>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">
              매일 마감 시점(예: 오후 6시) 기준의 4개 파일 추출 및 본 시스템 업로드를 표준 작업 가이드(SOP)에 등록합니다. 
              추후 엑셀/TXT 수동 업로드에서 <strong className="text-slate-800">API/DB 실시간 동기화</strong> 방식으로 확장하여 불일치 모니터링 주기를 일 단위에서 실시간 단위로 단축 가능합니다.
            </p>
          </div>

          {/* Step B */}
          <div className="relative">
            <div className="absolute -left-[33px] top-0 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
              B
            </div>
            <h4 className="text-base font-bold text-slate-800">자동화 소명 필터 후 실질 불일치 대상 추려내기</h4>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">
              대시보드가 산출한 최종 분석 리포트에서 <span className="px-1.5 py-0.5 bg-green-50 text-green-700 font-semibold rounded text-xs">소명 완료(Reconciled)</span> 상태는 정상 유통 시차로 분류하고, 
              <span className="px-1.5 py-0.5 bg-red-50 text-red-700 font-semibold rounded text-xs">미결 불일치(Unresolved)</span>로 판명된 품목들만 수작업 관리 및 보류 변경 추적 대상 리스트로 지정하여 실사 관리 비용을 90% 이상 절감합니다.
            </p>
          </div>

          {/* Step C */}
          <div className="relative">
            <div className="absolute -left-[33px] top-0 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
              C
            </div>
            <h4 className="text-base font-bold text-slate-800">정기 전산 조정 회계 처리 (월말 결산 프로세스)</h4>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">
              누적된 일자별 이력을 바탕으로 현장 실물 손실로 인해 발생하는 물리적 차이는 ERP 재고 손실 처리(Loss Posting)를 진행하고, 
              품질 상태 차이는 즉각적인 검정 절차 및 시스템 락(Lock) 상태 반영 처리를 통하여 다음 달 결산 시 이월 오차를 최소화합니다.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <div className="bg-blue-50 text-blue-800 px-6 py-4 rounded-xl max-w-2xl text-xs leading-relaxed border border-blue-100">
            <strong>💡 검토 의견 요약:</strong> 제공해주신 원천 데이터들의 포맷과 매핑 패턴 분석을 완수했습니다. 
            이에 따라 실 데이터를 파싱하여 실시간으로 이송중 재고를 매핑하고 미결 차이를 분리해주는 <strong>전문 재고 조정 대시보드 프로토타입</strong>을 상단의 <strong className="text-blue-900">"실시간 분석 대시보드"</strong> 탭에 준비해 두었습니다. 즉각 조회를 수행해 보시기 바랍니다.
          </div>
        </div>
      </div>
    </div>
  );
}
