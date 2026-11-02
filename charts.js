/**
 * InventoLedger Lightweight SVG Charting Engine
 * Produces interactive Area Charts, Bar Charts, and Donut/Pie Charts
 * Authors: 24091A3215, 24091A3222
 */

window.InventoCharts = {
  // Format currency in Indian Rupees
  formatINR(val) {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  },

  /**
   * Render an Area Chart with gradient fill & dots
   */
  renderAreaChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !data || !data.length) return;

    const width = container.clientWidth || 500;
    const height = options.height || 260;
    const padding = { top: 20, right: 24, bottom: 35, left: 55 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map(d => Number(d.value || 0));
    const maxValue = Math.max(...values, 1000) * 1.15;
    const minValue = 0;

    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((Number(d.value || 0) - minValue) / (maxValue - minValue)) * chartHeight;
      return { x, y, label: d.label, value: d.value };
    });

    // Build SVG Path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth cubic bezier curve
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    // Horizontal grid lines
    const gridLines = [];
    const stepCount = 4;
    for (let i = 0; i <= stepCount; i++) {
      const yVal = (maxValue / stepCount) * i;
      const yPos = padding.top + chartHeight - (i / stepCount) * chartHeight;
      gridLines.push(`
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="#1e293b" stroke-dasharray="3,3" />
        <text x="${padding.left - 10}" y="${yPos + 4}" fill="#64748b" font-size="11" text-anchor="end">${yVal >= 1000 ? (yVal / 1000).toFixed(0) + 'k' : yVal.toFixed(0)}</text>
      `);
    }

    // X-axis labels
    const xLabels = points.map(p => `
      <text x="${p.x}" y="${height - 10}" fill="#94a3b8" font-size="11" text-anchor="middle">${p.label}</text>
    `).join('');

    // Dots
    const dots = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="#6366f1" stroke="#ffffff" stroke-width="2" class="chart-point" data-label="${p.label}" data-value="${p.value}" />
    `).join('');

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        ${gridLines.join('')}
        <path d="${areaD}" fill="url(#areaGradient)" />
        <path d="${pathD}" fill="none" stroke="#6366f1" stroke-width="2.5" />
        ${dots}
        ${xLabels}
      </svg>
    `;
  },

  /**
   * Render a Bar Chart (Branch Sales)
   */
  renderBarChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !data || !data.length) return;

    const width = container.clientWidth || 500;
    const height = options.height || 260;
    const padding = { top: 20, right: 20, bottom: 35, left: 55 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map(d => Number(d.value || 0));
    const maxValue = Math.max(...values, 50000) * 1.15;

    const barWidth = Math.min(38, chartWidth / data.length - 14);

    const bars = data.map((d, i) => {
      const val = Number(d.value || 0);
      const barH = (val / maxValue) * chartHeight;
      const x = padding.left + (i * (chartWidth / data.length)) + ((chartWidth / data.length - barWidth) / 2);
      const y = padding.top + chartHeight - barH;

      return `
        <g class="bar-group" data-branch="${d.label}" data-val="${val}">
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="5" fill="#6366f1" />
          <text x="${x + barWidth / 2}" y="${height - 10}" fill="#94a3b8" font-size="11" text-anchor="middle">${d.label}</text>
          <text x="${x + barWidth / 2}" y="${y - 6}" fill="#a5b4fc" font-size="10" font-weight="600" text-anchor="middle">${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}</text>
        </g>
      `;
    }).join('');

    // Grid lines
    const gridLines = [];
    for (let i = 0; i <= 3; i++) {
      const yVal = (maxValue / 3) * i;
      const yPos = padding.top + chartHeight - (i / 3) * chartHeight;
      gridLines.push(`
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="#1e293b" stroke-dasharray="3,3" />
        <text x="${padding.left - 10}" y="${yPos + 4}" fill="#64748b" font-size="11" text-anchor="end">${yVal >= 1000 ? (yVal / 1000).toFixed(0) + 'k' : yVal.toFixed(0)}</text>
      `);
    }

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
        ${gridLines.join('')}
        ${bars}
      </svg>
    `;
  },

  /**
   * Render a Donut / Pie Chart (Inventory Health)
   */
  renderDonutChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container || !data || !data.length) return;

    const size = 180;
    const strokeWidth = 26;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const total = data.reduce((acc, d) => acc + Number(d.value || 0), 0) || 1;

    let currentOffset = 0;
    const slices = data.map((d) => {
      const val = Number(d.value || 0);
      const ratio = val / total;
      const dashArray = `${ratio * circumference} ${circumference}`;
      const dashOffset = -currentOffset;
      currentOffset += ratio * circumference;

      return `
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" 
          fill="transparent" 
          stroke="${d.color || '#6366f1'}" 
          stroke-width="${strokeWidth}" 
          stroke-dasharray="${dashArray}" 
          stroke-dashoffset="${dashOffset}" 
          style="transition: stroke-dasharray 0.5s ease;"
        />
      `;
    }).join('');

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
          ${slices}
        </svg>
      </div>
    `;
  }
};
