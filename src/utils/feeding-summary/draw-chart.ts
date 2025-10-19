export interface ChartDataPoint {
  amount: number;
  timestamp: number;
}

export interface DrawChartParams {
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  data: ChartDataPoint[];
}

export function drawChart({ canvas, host, data }: DrawChartParams): void {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  if (!displayWidth || !displayHeight) {
    return;
  }

  const dpr = window.devicePixelRatio ?? 1;
  const width = Math.floor(displayWidth * dpr);
  const height = Math.floor(displayHeight * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, displayWidth, displayHeight);

  if (!data.length) {
    return;
  }

  const styles = getComputedStyle(host);
  const primaryColor = styles.getPropertyValue('--md-sys-color-primary').trim() || '#6750a4';
  const gridColor =
    styles.getPropertyValue('--md-sys-color-outline-variant').trim() || 'rgba(0,0,0,0.1)';
  const baselineColor =
    styles.getPropertyValue('--md-sys-color-outline').trim() || 'rgba(0,0,0,0.2)';
  const textColor =
    styles.getPropertyValue('--md-sys-color-on-surface-variant').trim() || '#625b71';

  const topPadding = 16;
  const leftPadding = data.length > 6 ? 28 : 16;
  const rightPadding = 16;
  const bottomPadding = data.length > 6 ? 64 : 32;
  const chartHeight = Math.max(0, displayHeight - topPadding - bottomPadding);
  const chartWidth = Math.max(0, displayWidth - leftPadding - rightPadding);

  const maxAmount = data.reduce((max, entry) => Math.max(max, entry.amount), 0);
  if (maxAmount <= 0 || chartWidth <= 0 || chartHeight <= 0) {
    return;
  }

  context.strokeStyle = gridColor;
  context.lineWidth = 1;
  context.font = '12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.textBaseline = 'top';

  const gridLines = 4;
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

  const barWidth = Math.max(6, chartWidth / (data.length * 1.7));
  const gap =
    data.length > 1 ? Math.max(4, (chartWidth - barWidth * data.length) / (data.length - 1)) : 0;
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  let x = leftPadding;
  for (let i = 0; i < data.length; i += 1) {
    const entry = data[i];
    const barHeight = (entry.amount / maxAmount) * chartHeight;
    const y = topPadding + chartHeight - barHeight;

    context.fillStyle = primaryColor;
    context.globalAlpha = 0.85;
    context.fillRect(x, y, barWidth, barHeight);
    context.globalAlpha = 1;

    const label = timeFormatter.format(entry.timestamp);

    context.save();
    const labelYOffset = data.length > 6 ? 20 : 10;
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

    x += barWidth + gap;
  }
}
