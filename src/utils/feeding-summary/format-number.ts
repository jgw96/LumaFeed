export function formatNumber(value: number, maxFractionDigits = 0): string {
  const hasFraction = Math.abs(value - Math.trunc(value)) > Number.EPSILON;
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: maxFractionDigits > 0 && hasFraction ? 1 : 0,
  }).format(value);
}
