import {
  SLocQuantityDiff,
  QualityStatusDiff,
  MaterialTypeDiff,
  InTransitInventory,
  ReconciledItem,
  DailyReport,
} from '../types';

export function reconcileDailyData(
  slocQtyData: SLocQuantityDiff[],
  qualityData: QualityStatusDiff[],
  matTypeData: MaterialTypeDiff[],
  inTransitData: InTransitInventory[]
): ReconciledItem[] {
  const itemMap = new Map<string, {
    material: string;
    lotNo: string;
    plant: string;
    sloc: string;
    unit: string;
    slocDiff?: SLocQuantityDiff;
    qualityDiff?: QualityStatusDiff;
    materialTypeDiff?: MaterialTypeDiff;
  }>();

  // Helper to ensure item exists in map and returns it
  const getOrCreateItem = (material: string, lotNo: string, plant: string, sloc: string, unit: string) => {
    const key = `${material.trim()}_${lotNo.trim()}`;
    if (!itemMap.has(key)) {
      itemMap.set(key, {
        material: material.trim(),
        lotNo: lotNo.trim(),
        plant: plant.trim(),
        sloc: sloc.trim(),
        unit: unit.trim(),
      });
    }
    return itemMap.get(key)!;
  };

  // 1. Process SLoc Quantity Diff
  for (const row of slocQtyData) {
    const item = getOrCreateItem(
      row.material,
      row.lotNo,
      row.plant,
      row.wmsSLoc || row.erpSLoc,
      row.unit
    );
    item.slocDiff = row;
    if (row.plant) item.plant = row.plant;
    if (row.wmsSLoc || row.erpSLoc) item.sloc = row.wmsSLoc || row.erpSLoc;
    if (row.unit) item.unit = row.unit;
  }

  // 2. Process Quality Status Diff
  for (const row of qualityData) {
    const item = getOrCreateItem(
      row.material,
      row.lotNo,
      row.plant,
      row.sloc,
      row.unit
    );
    item.qualityDiff = row;
    if (row.plant) item.plant = row.plant;
    if (row.sloc) item.sloc = row.sloc;
    if (row.unit) item.unit = row.unit;
  }

  // 3. Process Material Type Diff
  for (const row of matTypeData) {
    const item = getOrCreateItem(
      row.material,
      row.lotNo,
      row.plant,
      row.sloc,
      row.unit
    );
    item.materialTypeDiff = row;
    if (row.plant) item.plant = row.plant;
    if (row.sloc) item.sloc = row.sloc;
    if (row.unit) item.unit = row.unit;
  }

  const reconciledItems: ReconciledItem[] = [];

  // 4. Generate reconciled items and link with In Transit
  itemMap.forEach((meta, key) => {
    const { material, lotNo, plant, sloc, unit, slocDiff, qualityDiff, materialTypeDiff } = meta;

    // Find all matching in-transit records for this material and lotNo
    const relevantInTransit = inTransitData.filter(
      it => it.material.trim() === material && it.lotNo.trim() === lotNo
    );

    const totalInTransitQty = relevantInTransit.reduce((sum, r) => sum + r.qty, 0);

    // Safeguard to determine total WMS & ERP Quantities
    // Look at SLoc first, then Quality, then Material Type
    let totalWmsQty = 0;
    let totalErpQty = 0;
    let netDiff = 0;

    if (slocDiff) {
      totalWmsQty = slocDiff.wmsQty;
      totalErpQty = slocDiff.erpQty;
      netDiff = slocDiff.diffQty;
    } else if (qualityDiff) {
      totalWmsQty = qualityDiff.wmsTotal;
      totalErpQty = qualityDiff.erpTotal;
      netDiff = qualityDiff.diffTotal;
    } else if (materialTypeDiff) {
      totalWmsQty = materialTypeDiff.wmsQty;
      totalErpQty = materialTypeDiff.erpQty;
      netDiff = materialTypeDiff.diffQty;
    }

    // Determine reconciliation status
    // If the difference is negative (ERP has more than WMS) and we have in-transit shipments,
    // we can add the in-transit quantity to reconcile it.
    // Why is ERP > WMS when in transit?
    // Because in ERP, stock is still recorded in issuing location (e.g., 2400) until the receiving SLoc performs a Goods Receipt.
    // In WMS, the stock is physically removed from the storage bins on dispatch, so WMS shows 0.
    // Therefore, WMS - ERP = -InTransit.
    // If we add the In-Transit stock to WMS, it should match ERP: WMS (0) + InTransit (4700) = ERP (4700).
    const isExplainedByInTransit = Math.abs(netDiff + totalInTransitQty) < 0.1;
    const isPartial = !isExplainedByInTransit && totalInTransitQty > 0 && Math.abs(netDiff) > 0;

    let reconciliationStatus: 'RECONCILED' | 'PARTIALLY_RECONCILED' | 'UNRESOLVED' = 'UNRESOLVED';
    let reconciledQty = 0;
    let unresolvedQty = netDiff;
    let explanation = '';

    if (Math.abs(netDiff) < 0.1) {
      reconciliationStatus = 'RECONCILED';
      reconciledQty = 0;
      unresolvedQty = 0;
      explanation = 'WMS와 ERP의 수량이 일치합니다. (정상 재고)';
    } else if (isExplainedByInTransit) {
      reconciliationStatus = 'RECONCILED';
      reconciledQty = totalInTransitQty;
      unresolvedQty = 0;
      explanation = `이송중 재고(${totalInTransitQty.toLocaleString()} ${unit})로 인해 수량 차이가 100% 소명되었습니다. (출하완료 후 입고처리 대기 중)`;
    } else if (isPartial) {
      reconciliationStatus = 'PARTIALLY_RECONCILED';
      reconciledQty = totalInTransitQty;
      // If ERP has more than WMS (netDiff is negative)
      unresolvedQty = netDiff + totalInTransitQty;
      explanation = `이송중 재고(${totalInTransitQty.toLocaleString()} ${unit})로 일부 소명되었으나, 여전히 ${Math.abs(unresolvedQty).toLocaleString()} ${unit}의 차이가 존재하여 추가 분석이 필요합니다.`;
    } else {
      reconciliationStatus = 'UNRESOLVED';
      reconciledQty = 0;
      unresolvedQty = netDiff;
      explanation = '이송중 재고로 소명되지 않는 실제 재고수량 또는 상태 차이입니다. 현장 실사 및 수작업 조정이 필요합니다.';
    }

    // Check for quality status mismatch
    if (qualityDiff && reconciliationStatus !== 'RECONCILED') {
      const statusMismatches: string[] = [];
      if (qualityDiff.diffInspection !== 0) statusMismatches.push(`검사전: ${qualityDiff.diffInspection.toLocaleString()}`);
      if (qualityDiff.diffAvailable !== 0) statusMismatches.push(`가용: ${qualityDiff.diffAvailable.toLocaleString()}`);
      if (qualityDiff.diffBlocked !== 0) statusMismatches.push(`보류: ${qualityDiff.diffBlocked.toLocaleString()}`);
      if (qualityDiff.diffRestricted !== 0) statusMismatches.push(`제한: ${qualityDiff.diffRestricted.toLocaleString()}`);
      
      if (statusMismatches.length > 0 && totalInTransitQty === 0) {
        explanation += ` [품질상태 불일치 - ${statusMismatches.join(', ')}]`;
      }
    }

    // Check for material classification mismatch (MTO vs MTS)
    if (materialTypeDiff && reconciliationStatus !== 'RECONCILED') {
      if (materialTypeDiff.wmsType !== materialTypeDiff.erpType) {
        explanation += ` [자재구분 불일치 - WMS: ${materialTypeDiff.wmsType}, ERP: ${materialTypeDiff.erpType}]`;
      }
    }

    reconciledItems.push({
      key,
      material,
      lotNo,
      plant,
      sloc,
      unit,
      slocDiff,
      qualityDiff,
      materialTypeDiff,
      inTransitRecords: relevantInTransit,
      totalWmsQty,
      totalErpQty,
      netDiff,
      reconciliationStatus,
      reconciledQty,
      unresolvedQty,
      explanation,
    });
  });

  // Sort items: unresolved first, then partially reconciled, then reconciled
  return reconciledItems.sort((a, b) => {
    const score = { UNRESOLVED: 0, PARTIALLY_RECONCILED: 1, RECONCILED: 2 };
    const diffA = score[a.reconciliationStatus];
    const diffB = score[b.reconciliationStatus];
    if (diffA !== diffB) return diffA - diffB;
    return Math.abs(b.netDiff) - Math.abs(a.netDiff); // Sort by absolute difference desc
  });
}
