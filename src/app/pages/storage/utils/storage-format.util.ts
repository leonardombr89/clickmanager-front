export function formatBytes(value: number | null | undefined): string {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const amount = bytes / Math.pow(1024, index);
  const precision = amount >= 10 || index === 0 ? 0 : 1;

  return `${amount.toFixed(precision)} ${units[index]}`;
}
