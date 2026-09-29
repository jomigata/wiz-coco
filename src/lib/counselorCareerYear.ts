export function computeCareerYearsFromStartYear(startYear: number, referenceYear = new Date().getFullYear()): number {
  if (!Number.isFinite(startYear) || startYear <= 0 || startYear > referenceYear) return 0;
  return Math.max(1, referenceYear - startYear + 1);
}

export function formatCareerYearsLabel(startYear: number, referenceYear = new Date().getFullYear()): string {
  if (!startYear) return '미등록';
  const years = computeCareerYearsFromStartYear(startYear, referenceYear);
  return `${years}년 (${startYear}년 시작)`;
}

export function careerStartYearOptions(referenceYear = new Date().getFullYear(), span = 55): number[] {
  return Array.from({ length: span }, (_, i) => referenceYear - i);
}
