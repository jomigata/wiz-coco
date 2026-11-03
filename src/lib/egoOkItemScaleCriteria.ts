import criteriaDoc from '../../docs/internal-materials/ego-ok/items-99-scale-criteria-ko.json';

export type EgoOkItemScaleCriteria = {
  scaleType: string;
  criterion: string;
  tip: string;
  extraTip: string;
};

const byNo = criteriaDoc.byNo as Record<string, EgoOkItemScaleCriteria>;

export function getItemScaleCriteria(no: number): EgoOkItemScaleCriteria | undefined {
  return byNo[String(no)];
}

/** 소분류(동일 scaleType) 문항들의 척도기준점·활용팁 (중복 제거, 문항 번호 순) */
export function aggregateScaleCriteria(itemNos: readonly number[]): {
  criteriaLines: string[];
  tipLines: string[];
} {
  const criteriaOrder: string[] = [];
  const criteriaSeen = new Set<string>();
  const tipOrder: string[] = [];
  const tipSeen = new Set<string>();

  for (const no of itemNos) {
    const row = getItemScaleCriteria(no);
    if (!row) continue;
    if (row.criterion && !criteriaSeen.has(row.criterion)) {
      criteriaSeen.add(row.criterion);
      criteriaOrder.push(row.criterion);
    }
    if (row.tip && !tipSeen.has(row.tip)) {
      tipSeen.add(row.tip);
      tipOrder.push(row.tip);
    }
  }

  return { criteriaLines: criteriaOrder, tipLines: tipOrder };
}
