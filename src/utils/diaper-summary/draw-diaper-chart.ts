import type { DiaperChartPoint } from '../../types/diaper-log.js';

export interface DrawDiaperChartParams {
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  data: DiaperChartPoint[];
}

export function drawDiaperChart({ canvas, host, data }: DrawDiaperChartParams): void {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  if (!displayWidth || !displayHeight) {
    return;
  }

  const devicePixelRatio = window.devicePixelRatio ?? 1;
  const width = Math.floor(displayWidth * devicePixelRatio);
  const height = Math.floor(displayHeight * devicePixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext('2d');
  } catch (error) {
    console.warn('drawDiaperChart: unable to acquire 2D context', error);
    return;
  }
  if (!context) {
    return;
  }

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  context.clearRect(0, 0, displayWidth, displayHeight);

  if (!data.length) {
    return;
  }

  const styles = getComputedStyle(host);
  const wetColor =
    styles.getPropertyValue('--diaper-wet-color').trim() ||
    styles.getPropertyValue('--md-sys-color-primary').trim() ||
    '#6750a4';
  const dirtyColor =
    styles.getPropertyValue('--diaper-dirty-color').trim() ||
    styles.getPropertyValue('--md-sys-color-tertiary').trim() ||
    '#625b71';
  const bothColor =
    styles.getPropertyValue('--diaper-both-color').trim() ||
    styles.getPropertyValue('--md-sys-color-secondary').trim() ||
    '#7d5260';
  const gridColor =
    styles.getPropertyValue('--md-sys-color-outline-variant').trim() || 'rgba(0, 0, 0, 0.1)';
  const baselineColor =
    styles.getPropertyValue('--md-sys-color-outline').trim() || 'rgba(0, 0, 0, 0.2)';
  const textColor =
    styles.getPropertyValue('--md-sys-color-on-surface-variant').trim() || '#625b71';

  const topPadding = 16;
  const leftPadding = data.length > 6 ? 28 : 16;
  const rightPadding = 16;
  const bottomPadding = data.length > 6 ? 64 : 40;
  const chartHeight = Math.max(0, displayHeight - topPadding - bottomPadding);
  const chartWidth = Math.max(0, displayWidth - leftPadding - rightPadding);

  const maxTotal = data.reduce((max, entry) => Math.max(max, entry.total), 0);
  if (maxTotal <= 0 || chartWidth <= 0 || chartHeight <= 0) {
    return;
  }

  context.strokeStyle = gridColor;
  context.lineWidth = 1;
  context.font = '12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.textBaseline = 'top';

  const gridLines = Math.min(4, maxTotal);
  for (let i = 1; i < gridLines; i += 1) {
    const ratio = i / gridLines;
    const y = topPadding + chartHeight - chartHeight * ratio;
    context.globalAlpha = 0.5;
    context.beginPath();
    context.moveTo(leftPadding, y);
    context.lineTo(leftPadding + chartWidth, y);
    context.stroke();
  }
  context.globalAlpha = 1;

  context.strokeStyle = baselineColor;
  context.beginPath();
  context.moveTo(leftPadding, topPadding + chartHeight + 0.5);
  context.lineTo(leftPadding + chartWidth, topPadding + chartHeight + 0.5);
  context.stroke();

  const barWidth = Math.max(10, chartWidth / (data.length * 1.8));
  const gap =
    data.length > 1 ? Math.max(6, (chartWidth - barWidth * data.length) / (data.length - 1)) : 0;

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: 'numeric',
  });

  let x = leftPadding;
  for (const entry of data) {
    const wetHeight = (entry.wet / maxTotal) * chartHeight;
    const bothHeight = (entry.both / maxTotal) * chartHeight;
    const dirtyHeight = (entry.dirty / maxTotal) * chartHeight;

    let currentY = topPadding + chartHeight;

    if (entry.wet > 0) {
      currentY -= wetHeight;
      context.fillStyle = wetColor;
      context.globalAlpha = 0.85;
      context.fillRect(x, currentY, barWidth, wetHeight);
    }

    if (entry.both > 0) {
      currentY -= bothHeight;
      context.fillStyle = bothColor;
      context.globalAlpha = 0.9;
      context.fillRect(x, currentY, barWidth, bothHeight);
    }

    if (entry.dirty > 0) {
      currentY -= dirtyHeight;
      context.fillStyle = dirtyColor;
      context.globalAlpha = 0.85;
      context.fillRect(x, currentY, barWidth, dirtyHeight);
    }

    context.globalAlpha = 1;

    const label = dateFormatter.format(entry.timestamp);

    context.save();
    const labelYOffset = data.length > 6 ? 24 : 12;
    context.translate(x + barWidth / 2, topPadding + chartHeight + labelYOffset);
    if (data.length > 6) {
      context.rotate(-Math.PI / 4);
      context.textAlign = 'right';
    } else {
      context.textAlign = 'center';
    }
    context.fillStyle = textColor;
    context.fillText(label, 0, 0);
    context.restore();

    if (entry.total > 0) {
      context.save();
      context.font =
        'bold 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      context.fillStyle = textColor;
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      context.fillText(String(entry.total), x + barWidth / 2, Math.max(topPadding, currentY - 4));
      context.restore();
    }

    x += barWidth + gap;
  }
}
