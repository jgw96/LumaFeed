export interface TimelineDataPoint {
  date: string; // YYYY-MM-DD
  feedings: number;
  diapers: number;
}

export interface DrawTimelineChartParams {
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  data: TimelineDataPoint[];
}

export function drawTimelineChart({ canvas, host, data }: DrawTimelineChartParams): void {
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
  const secondaryColor = styles.getPropertyValue('--md-sys-color-secondary').trim() || '#625b71';
  const gridColor =
    styles.getPropertyValue('--md-sys-color-outline-variant').trim() || 'rgba(0,0,0,0.1)';
  const textColor =
    styles.getPropertyValue('--md-sys-color-on-surface-variant').trim() || '#625b71';

  const topPadding = 20;
  const leftPadding = 40;
  const rightPadding = 20;
  const bottomPadding = 60;
  const chartHeight = Math.max(0, displayHeight - topPadding - bottomPadding);
  const chartWidth = Math.max(0, displayWidth - leftPadding - rightPadding);

  if (chartWidth <= 0 || chartHeight <= 0) {
    return;
  }

  // Find max value for scaling
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.feedings, d.diapers)),
    1
  );

  // Draw grid lines
  context.strokeStyle = gridColor;
  context.lineWidth = 1;
  context.font = '11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillStyle = textColor;

  const gridLines = 4;
  for (let i = 0; i <= gridLines; i += 1) {
    const ratio = i / gridLines;
    const y = topPadding + chartHeight - chartHeight * ratio;
    const value = Math.round(maxValue * ratio);

    context.globalAlpha = 0.3;
    context.beginPath();
    context.moveTo(leftPadding, y);
    context.lineTo(leftPadding + chartWidth, y);
    context.stroke();
    context.globalAlpha = 1;

    // Y-axis labels
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillText(value.toString(), leftPadding - 8, y);
  }

  // Calculate points for lines
  const feedingPoints: Array<{ x: number; y: number }> = [];
  const diaperPoints: Array<{ x: number; y: number }> = [];

  data.forEach((point, index) => {
    const x = leftPadding + (chartWidth / (data.length - 1 || 1)) * index;
    const feedingY = topPadding + chartHeight - (point.feedings / maxValue) * chartHeight;
    const diaperY = topPadding + chartHeight - (point.diapers / maxValue) * chartHeight;

    feedingPoints.push({ x, y: feedingY });
    diaperPoints.push({ x, y: diaperY });
  });

  // Draw feeding line
  context.strokeStyle = primaryColor;
  context.lineWidth = 2.5;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  context.beginPath();
  feedingPoints.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.stroke();

  // Draw feeding points
  context.fillStyle = primaryColor;
  feedingPoints.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.fill();
  });

  // Draw diaper line
  context.strokeStyle = secondaryColor;
  context.lineWidth = 2.5;

  context.beginPath();
  diaperPoints.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.stroke();

  // Draw diaper points
  context.fillStyle = secondaryColor;
  diaperPoints.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.fill();
  });

  // Draw X-axis labels
  context.fillStyle = textColor;
  context.textAlign = 'center';
  context.textBaseline = 'top';

  data.forEach((point, index) => {
    const x = leftPadding + (chartWidth / (data.length - 1 || 1)) * index;
    const y = topPadding + chartHeight + 8;

    // Format date label (show every nth label to avoid crowding)
    const showLabel = data.length <= 7 || index % Math.ceil(data.length / 7) === 0 || index === data.length - 1;
    if (showLabel) {
      const date = new Date(point.date);
      const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      // Rotate text for better fit
      context.save();
      context.translate(x, y);
      context.rotate(-Math.PI / 4);
      context.fillText(label, 0, 0);
      context.restore();
    }
  });
}
