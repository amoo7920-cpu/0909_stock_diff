import {
  SLocQuantityDiff,
  QualityStatusDiff,
  MaterialTypeDiff,
  InTransitInventory,
} from '../types';

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let insideQuote = false;
  let currentField = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === ',' && !insideQuote) {
      result.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(currentField.trim());
  return result;
}

export function parseNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/["\s,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Check if a line is a header row
export function isHeader(cells: string[]): boolean {
  const joinCells = cells.join(',').toLowerCase();
  return (
    joinCells.includes('material') ||
    joinCells.includes('lot_no') ||
    joinCells.includes('lot no') ||
    joinCells.includes('plant') ||
    joinCells.includes('자재') ||
    joinCells.includes('품질')
  );
}

// Check if a line is a total/summary row
export function isTotalRow(cells: string[]): boolean {
  if (cells.length === 0) return true;
  const firstCol = cells[0].toLowerCase();
  const secondCol = cells[1] ? cells[1].toLowerCase() : '';
  const firstNonEmpty = cells.find(c => c.trim().length > 0) || '';
  
  return (
    firstCol.includes('합계') ||
    firstCol.includes('총계') ||
    firstCol.includes('total') ||
    firstCol.includes('հ') || // Handles corrupted "합계"
    firstNonEmpty.includes('합계') ||
    firstNonEmpty.includes('총계') ||
    firstNonEmpty.includes('total') ||
    firstNonEmpty.includes('հ')
  );
}

export function parseSLocQuantityText(text: string): SLocQuantityDiff[] {
  const lines = text.split(/\r?\n/);
  const data: SLocQuantityDiff[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = parseCSVLine(line);
    
    // Skip empty lines, headers, and total rows
    if (isHeader(cells) || isTotalRow(cells)) continue;
    if (cells.length < 6) continue;
    
    // Map cells: index 0 is No
    // index 1: Plant, index 2: Valuation Class, index 3: Material, index 4: LotNo, index 5: Unit
    // index 6: WmsSLoc, index 7: WmsQty, index 8: ErpSLoc, index 9: ErpQty, index 10: DiffQty
    const plant = cells[1] || '';
    const materialType = cells[2] || '';
    const material = cells[3] || '';
    const lotNo = cells[4] || '';
    const unit = cells[5] || '';
    const wmsSLoc = cells[6] || '';
    const wmsQty = parseNumber(cells[7]);
    const erpSLoc = cells[8] || '';
    const erpQty = parseNumber(cells[9]);
    const diffQty = parseNumber(cells[10]);
    
    if (material) {
      data.push({
        plant,
        materialType,
        material,
        lotNo,
        unit,
        wmsSLoc,
        wmsQty,
        erpSLoc,
        erpQty,
        diffQty,
      });
    }
  }
  
  return data;
}

export function parseQualityStatusText(text: string): QualityStatusDiff[] {
  const lines = text.split(/\r?\n/);
  const data: QualityStatusDiff[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = parseCSVLine(line);
    
    if (isHeader(cells) || isTotalRow(cells)) continue;
    if (cells.length < 12) continue;
    
    const plant = cells[1] || '';
    const sloc = cells[2] || '';
    const materialType = cells[3] || '';
    const material = cells[4] || '';
    const lotNo = cells[5] || '';
    const unit = cells[6] || '';
    
    // WMS
    const wmsInspection = parseNumber(cells[7]);
    const wmsAvailable = parseNumber(cells[8]);
    const wmsBlocked = parseNumber(cells[9]);
    const wmsRestricted = parseNumber(cells[10]);
    const wmsTotal = parseNumber(cells[11]);
    
    // ERP
    const erpInspection = parseNumber(cells[12]);
    const erpAvailable = parseNumber(cells[13]);
    const erpBlocked = parseNumber(cells[14]);
    const erpRestricted = parseNumber(cells[15]);
    const erpTotal = parseNumber(cells[16]);
    
    // Diff
    const diffInspection = parseNumber(cells[17]);
    const diffAvailable = parseNumber(cells[18]);
    const diffBlocked = parseNumber(cells[19]);
    const diffRestricted = parseNumber(cells[20]);
    const diffTotal = parseNumber(cells[21]);
    
    if (material) {
      data.push({
        plant,
        sloc,
        materialType,
        material,
        lotNo,
        unit,
        wmsInspection,
        wmsAvailable,
        wmsBlocked,
        wmsRestricted,
        wmsTotal,
        erpInspection,
        erpAvailable,
        erpBlocked,
        erpRestricted,
        erpTotal,
        diffInspection,
        diffAvailable,
        diffBlocked,
        diffRestricted,
        diffTotal,
      });
    }
  }
  
  return data;
}

export function parseMaterialTypeDiffText(text: string): MaterialTypeDiff[] {
  const lines = text.split(/\r?\n/);
  const data: MaterialTypeDiff[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = parseCSVLine(line);
    
    if (isHeader(cells) || isTotalRow(cells)) continue;
    if (cells.length < 10) continue;
    
    const plant = cells[1] || '';
    const sloc = cells[2] || '';
    const materialType = cells[3] || '';
    const material = cells[4] || '';
    const lotNo = cells[5] || '';
    const unit = cells[6] || '';
    
    const wmsType = cells[7] || '';
    const wmsOrder = cells[8] || '';
    const wmsQty = parseNumber(cells[9]);
    
    const erpType = cells[10] || '';
    const erpOrder = cells[11] || '';
    const erpQty = parseNumber(cells[12]);
    
    const diffQty = parseNumber(cells[13]);
    
    if (material) {
      data.push({
        plant,
        sloc,
        materialType,
        material,
        lotNo,
        unit,
        wmsType,
        wmsOrder,
        wmsQty,
        erpType,
        erpOrder,
        erpQty,
        diffQty,
      });
    }
  }
  
  return data;
}

export function parseInTransitText(text: string): InTransitInventory[] {
  const lines = text.split(/\r?\n/);
  const data: InTransitInventory[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = parseCSVLine(line);
    
    if (isHeader(cells) || isTotalRow(cells)) continue;
    if (cells.length < 12) continue;
    
    const issuingPlant = cells[1] || '';
    const issuingSLoc = cells[2] || '';
    const receivingPlant = cells[3] || '';
    const receivingSLoc = cells[4] || '';
    const materialGroup = cells[5] || '';
    const material = cells[6] || '';
    const materialDesc = cells[7] || '';
    const shortCode = cells[8] || '';
    const lotNo = cells[9] || '';
    const serialNo = cells[10] || '';
    
    // Quantity might be at index 12 if index 11 is blank
    let qty = 0;
    let status1 = '';
    let status2 = '';
    
    if (cells.length > 13) {
      qty = parseNumber(cells[12]);
      status1 = cells[13] || '';
      status2 = cells[14] || '';
    } else {
      qty = parseNumber(cells[11]);
      status1 = cells[12] || '';
    }
    
    if (material) {
      data.push({
        issuingPlant,
        issuingSLoc,
        receivingPlant,
        receivingSLoc,
        materialGroup,
        material,
        materialDesc,
        shortCode,
        lotNo,
        serialNo,
        qty,
        status1,
        status2,
      });
    }
  }
  
  return data;
}
