export interface SLocQuantityDiff {
  plant: string;
  materialType: string; // e.g. FERT
  material: string;
  lotNo: string;
  unit: string;
  wmsSLoc: string;
  wmsQty: number;
  erpSLoc: string;
  erpQty: number;
  diffQty: number;
}

export interface QualityStatusDiff {
  plant: string;
  sloc: string;
  materialType: string; // e.g. FERT
  material: string;
  lotNo: string;
  unit: string;
  // WMS Statuses
  wmsInspection: number;
  wmsAvailable: number;
  wmsBlocked: number;
  wmsRestricted: number;
  wmsTotal: number;
  // ERP Statuses
  erpInspection: number;
  erpAvailable: number;
  erpBlocked: number;
  erpRestricted: number;
  erpTotal: number;
  // Differences (WMS - ERP)
  diffInspection: number;
  diffAvailable: number;
  diffBlocked: number;
  diffRestricted: number;
  diffTotal: number;
}

export interface MaterialTypeDiff {
  plant: string;
  sloc: string;
  materialType: string; // e.g. FERT
  material: string;
  lotNo: string;
  unit: string;
  wmsType: string; // MTS, MTO
  wmsOrder: string; // Sales Order
  wmsQty: number;
  erpType: string; // MTS, MTO
  erpOrder: string; // Sales Order
  erpQty: number;
  diffQty: number;
}

export interface InTransitInventory {
  issuingPlant: string;
  issuingSLoc: string;
  receivingPlant: string;
  receivingSLoc: string;
  materialGroup: string; // e.g. 반제품, 완제품
  material: string;
  materialDesc: string;
  shortCode: string; // e.g. BN740
  lotNo: string;
  serialNo: string; // e.g. D26I0508-01
  qty: number;
  status1: string; // e.g. 출하검사
  status2: string; // e.g. 출하완료
}

// Unified Reconciliation Record for UI
export interface ReconciledItem {
  key: string; // material_lotNo
  material: string;
  lotNo: string;
  plant: string;
  sloc: string;
  unit: string;
  
  // Storage Location discrepancies
  slocDiff?: SLocQuantityDiff;
  // Quality status discrepancies
  qualityDiff?: QualityStatusDiff;
  // Material type discrepancies
  materialTypeDiff?: MaterialTypeDiff;
  // Relevant in-transit records that explain the discrepancy
  inTransitRecords: InTransitInventory[];
  
  // Calculated summary metrics
  totalWmsQty: number;
  totalErpQty: number;
  netDiff: number;
  
  // Reconciliation Analysis
  reconciliationStatus: 'RECONCILED' | 'PARTIALLY_RECONCILED' | 'UNRESOLVED';
  reconciledQty: number; // Qty explained by in-transit
  unresolvedQty: number; // Remaining unexplained Qty
  explanation: string;
}

export interface DailyReport {
  date: string; // YYYY-MM-DD
  slocQtyData: SLocQuantityDiff[];
  qualityData: QualityStatusDiff[];
  matTypeData: MaterialTypeDiff[];
  inTransitData: InTransitInventory[];
}
