import { loadCsv } from "../data-loader.js";
import { COLORS, DEFAULTS } from "../utils/constants.js";
import { formatGt } from "../utils/format.js";
import { setActiveTrigger, setInsight } from "../utils/dom.js";

const policyState = {
  selectedEvent: DEFAULTS.policyEvent,
  currentYear: 2015
};

let policyData = [];
let policyEvents = [];
let timelineScale = null;

export async function initPolicyTimelineModule() {
  policyData = await loadCsv("data/processed/policy_events.csv");
  policyEvents = policyData.filter((item) => item.policy_id);

  const defaultEvent = policyEvents.find((item) => item.policy_id === policyState.selectedEvent);
  if (defaultEvent) {
    policyState.currentYear = defaultEvent.year;
  }

  bindPolicyTextTriggers();
  renderPolicyTimeline();
  updatePolicyInsight();
}

function bindPolicyTextTriggers() {
  document.querySelectorAll('.narrative-trigger[data-module="policy"]').forEach((trigger) => {
    trigger.addEventListener("click", () => selectPolicyEvent(trigger.dataset.event));
  });
}

function selectPolicyEvent(policyId) {
  const event = policyEvents.find((item) => item.policy_id === policyId);
  if (!event) {
    return;
  }

  policyState.selectedEvent = event.policy_id;
  policyState.currentYear = event.year;
  renderPolicyTimeline();
  updatePolicyInsight();
}

function renderPolicyTimeline() {
  const container = document.querySelector("#chart-policy");
  if (!container || policyData.length === 0) {
    return;
  }

  const years = policyData.map((item) => item.year);
  const emissions = policyData.map((item) => item.global_emissions).filter(hasNumber);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const minEmission = Math.min(...emissions) - 0.4;
  const maxEmission = Math.max(...emissions) + 0.4;

  const width = 960;
  const height = 520;
  const margin = { top: 58, right: 78, bottom: 146, left: 72 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const eventRailY = height - 112;

  const x = (year) => margin.left + ((year - minYear) / (maxYear - minYear)) * innerWidth;
  const y = (value) => margin.top + ((maxEmission - value) / (maxEmission - minEmission)) * innerHeight;
  timelineScale = { minYear, maxYear, x, y, plotLeft: margin.left, plotRight: width - margin.right };

  const visibleRows = policyData.filter((item) => item.year <= policyState.currentYear);
  const currentRow = nearestRow(policyState.currentYear);
  const selectedEvent = policyEvents.find((event) => event.policy_id === policyState.selectedEvent);
  const latestEvent = latestVisibleEvent();
  const activeEvent = selectedEvent && selectedEvent.year <= policyState.currentYear ? selectedEvent : latestEvent;

  container.innerHTML = `
    <div class="policy-timeline">
      <div class="policy-timeline__header">
        <p>拖动年份，观察全球排放曲线如何穿过关键国际气候治理节点。</p>
        <strong>${policyState.currentYear}</strong>
      </div>
      <svg class="policy-timeline__svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="全球碳排放与国际气候政策时间线">
        <rect class="policy-timeline__plot-bg" x="${margin.left}" y="${margin.top}" width="${innerWidth}" height="${innerHeight}"></rect>
        ${renderGrid(minYear, maxYear, minEmission, maxEmission, x, y, width, height, margin)}
        <path class="policy-timeline__line policy-timeline__line--ghost" d="${buildLinePath(policyData, x, y)}"></path>
        <path class="policy-timeline__line" data-policy-line="visible" d="${buildLinePath(visibleRows, x, y)}"></path>
        <line class="policy-timeline__cursor" data-policy-cursor x1="${x(policyState.currentYear)}" x2="${x(policyState.currentYear)}" y1="${margin.top}" y2="${eventRailY + 26}"></line>
        ${renderEventRail(x, eventRailY, activeEvent)}
        <circle class="policy-timeline__year-dot" data-policy-dot cx="${x(currentRow.year)}" cy="${y(currentRow.global_emissions)}" r="7"></circle>
        ${activeEvent ? renderActiveCallout(activeEvent, currentRow, x, y, width) : ""}
        <text class="policy-timeline__axis-title" x="${width - 18}" y="${margin.top + 8}" transform="rotate(90 ${width - 18} ${margin.top + 8})">全球 CO2 排放（GtCO2）</text>
      </svg>
      <div class="policy-timeline__controls">
        <button class="policy-timeline__button" type="button" data-policy-control="back">回到 ${minYear}</button>
        <label class="policy-timeline__slider-label">
          <span>拖动年份</span>
          <input class="policy-timeline__slider" type="range" min="${minYear}" max="${maxYear}" step="1" value="${policyState.currentYear}" aria-label="拖动年份">
        </label>
        <button class="policy-timeline__button" type="button" data-policy-control="latest">跳到最新</button>
      </div>
      <p class="policy-timeline__caption">
        当前年份：<strong>${policyState.currentYear}</strong>。全球排放约为 <strong>${formatGt(currentRow.global_emissions)}</strong>${activeEvent ? `；最近政策节点：<strong>${eventName(activeEvent)}</strong>` : "。"}
      </p>
    </div>
  `;

  bindTimelineControls(minYear, maxYear, margin.left, width - margin.right);
  setActiveTrigger("policy", (trigger) => trigger.dataset.event === policyState.selectedEvent);
}

function buildLinePath(rows, x, y) {
  return rows
    .filter((row) => hasNumber(row.global_emissions))
    .map((row, index) => `${index === 0 ? "M" : "L"} ${x(row.year).toFixed(2)} ${y(row.global_emissions).toFixed(2)}`)
    .join(" ");
}

function renderGrid(minYear, maxYear, minEmission, maxEmission, x, y, width, height, margin) {
  const lines = [];
  for (let year = minYear; year <= maxYear; year += 5) {
    lines.push(`
      <line class="policy-timeline__grid" x1="${x(year)}" x2="${x(year)}" y1="${margin.top}" y2="${height - margin.bottom}"></line>
      <text class="policy-timeline__tick" x="${x(year)}" y="${height - margin.bottom + 26}" text-anchor="middle">${year}</text>
    `);
  }

  for (let value = Math.ceil(minEmission / 2) * 2; value <= maxEmission; value += 2) {
    lines.push(`
      <line class="policy-timeline__grid" x1="${margin.left}" x2="${width - margin.right}" y1="${y(value)}" y2="${y(value)}"></line>
      <text class="policy-timeline__tick policy-timeline__tick--y" x="${width - margin.right + 12}" y="${y(value) + 4}">${value.toFixed(0)}</text>
    `);
  }

  return lines.join("");
}

function renderEventRail(x, railY, activeEvent) {
  const visibleEvents = policyEvents.filter((event) => event.year <= policyState.currentYear);

  return `
    <line class="policy-event-rail" x1="${x(policyData[0].year)}" x2="${x(policyData[policyData.length - 1].year)}" y1="${railY}" y2="${railY}"></line>
    ${visibleEvents.map((event, index) => {
      const isActive = activeEvent && event.policy_id === activeEvent.policy_id;
      const stem = index % 2 === 0 ? -18 : 18;
      return `
        <g class="policy-event${isActive ? " policy-event--active" : ""}" data-policy-id="${event.policy_id}" tabindex="0" role="button" aria-label="${event.policy_name}">
          <line class="policy-event__stem" x1="${x(event.year)}" x2="${x(event.year)}" y1="${railY}" y2="${railY + stem}"></line>
          <circle class="policy-event__dot" cx="${x(event.year)}" cy="${railY + stem}" r="${isActive ? 8 : 5}"></circle>
          ${isActive ? `<text class="policy-event__year" x="${x(event.year)}" y="${railY + stem + (stem < 0 ? -10 : 22)}" text-anchor="middle">${event.year}</text>` : ""}
        </g>
      `;
    }).join("")}
  `;
}

function renderActiveCallout(event, currentRow, x, y, width) {
  const pointX = x(currentRow.year);
  const pointY = y(currentRow.global_emissions);
  const boxWidth = 286;
  const boxHeight = 96;
  const boxX = pointX > width - 390 ? pointX - boxWidth - 28 : pointX + 28;
  const boxY = Math.max(72, Math.min(268, pointY - 62));
  const titleLines = splitLabel(eventName(event), 12);

  return `
    <g class="policy-callout">
      <line class="policy-callout__line" x1="${boxX + (boxX > pointX ? 0 : boxWidth)}" y1="${boxY + boxHeight / 2}" x2="${pointX}" y2="${pointY}"></line>
      <rect class="policy-callout__box" x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" rx="8"></rect>
      <text class="policy-callout__year" x="${boxX + 16}" y="${boxY + 24}">${currentRow.year}</text>
      <text class="policy-callout__eyebrow" x="${boxX + 82}" y="${boxY + 24}">最近政策节点</text>
      <text class="policy-callout__title" x="${boxX + 16}" y="${boxY + 50}">
        ${titleLines.map((line, index) => `<tspan x="${boxX + 16}" dy="${index === 0 ? 0 : 18}">${line}</tspan>`).join("")}
      </text>
      <text class="policy-callout__metric" x="${boxX + 16}" y="${boxY + 84}">${formatGt(currentRow.global_emissions)}</text>
    </g>
  `;
}

function splitLabel(label, maxLength) {
  return label.split(" ").reduce((lines, word) => {
    const last = lines[lines.length - 1] || "";
    if (`${last} ${word}`.trim().length > maxLength) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${last} ${word}`.trim();
    }
    return lines;
  }, [""]);
}

function bindTimelineControls(minYear, maxYear, plotLeft, plotRight) {
  const slider = document.querySelector(".policy-timeline__slider");
  const svg = document.querySelector(".policy-timeline__svg");
  const backButton = document.querySelector('[data-policy-control="back"]');
  const latestButton = document.querySelector('[data-policy-control="latest"]');

  slider?.addEventListener("input", () => updateCurrentYear(Number(slider.value), { soft: true }));
  slider?.addEventListener("change", () => {
    syncSelectedEventToYear(policyState.currentYear);
    renderPolicyTimeline();
    updatePolicyInsight();
  });
  backButton?.addEventListener("click", () => updateCurrentYear(minYear));
  latestButton?.addEventListener("click", () => updateCurrentYear(maxYear));

  document.querySelectorAll(".policy-event").forEach((marker) => {
    marker.addEventListener("click", () => selectPolicyEvent(marker.dataset.policyId));
    marker.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPolicyEvent(marker.dataset.policyId);
      }
    });
  });

  if (!svg) {
    return;
  }

  let dragging = false;
  const updateFromPointer = (event) => {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    const ratio = Math.max(0, Math.min(1, (svgPoint.x - plotLeft) / (plotRight - plotLeft)));
    const year = Math.round(minYear + ratio * (maxYear - minYear));
    updateCurrentYear(year, { soft: true });
  };

  svg.addEventListener("pointerdown", (event) => {
    dragging = true;
    svg.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  });

  svg.addEventListener("pointermove", (event) => {
    if (dragging) {
      updateFromPointer(event);
    }
  });

  svg.addEventListener("pointerup", (event) => {
    dragging = false;
    svg.releasePointerCapture(event.pointerId);
    syncSelectedEventToYear(policyState.currentYear);
    renderPolicyTimeline();
    updatePolicyInsight();
  });
}

function updateCurrentYear(year, options = {}) {
  policyState.currentYear = year;

  if (options.soft) {
    updateTimelineInPlace();
    updatePolicyInsight();
    return;
  }

  syncSelectedEventToYear(year);
  renderPolicyTimeline();
  updatePolicyInsight();
}

function syncSelectedEventToYear(year) {
  const eventAtYear = policyEvents.find((event) => event.year === year);
  if (eventAtYear) {
    policyState.selectedEvent = eventAtYear.policy_id;
  }
}

function updateTimelineInPlace() {
  if (!timelineScale) {
    return;
  }

  syncSelectedEventToNearestPast(policyState.currentYear);

  const { x, y } = timelineScale;
  const currentRow = nearestRow(policyState.currentYear);
  const visibleRows = policyData.filter((item) => item.year <= policyState.currentYear);
  const line = document.querySelector('[data-policy-line="visible"]');
  const cursor = document.querySelector("[data-policy-cursor]");
  const dot = document.querySelector("[data-policy-dot]");
  const headerYear = document.querySelector(".policy-timeline__header strong");
  const caption = document.querySelector(".policy-timeline__caption");
  const slider = document.querySelector(".policy-timeline__slider");
  const latestEvent = latestVisibleEvent();

  line?.setAttribute("d", buildLinePath(visibleRows, x, y));
  cursor?.setAttribute("x1", x(policyState.currentYear));
  cursor?.setAttribute("x2", x(policyState.currentYear));
  dot?.setAttribute("cx", x(currentRow.year));
  dot?.setAttribute("cy", y(currentRow.global_emissions));

  if (headerYear) {
    headerYear.textContent = policyState.currentYear;
  }

  if (slider && Number(slider.value) !== policyState.currentYear) {
    slider.value = policyState.currentYear;
  }

  if (caption) {
    caption.innerHTML = `当前年份：<strong>${policyState.currentYear}</strong>。全球排放约为 <strong>${formatGt(currentRow.global_emissions)}</strong>${latestEvent ? `；最近政策节点：<strong>${eventName(latestEvent)}</strong>` : "。"}`;
  }
}

function nearestRow(year) {
  return policyData.reduce((nearest, row) => {
    return Math.abs(row.year - year) < Math.abs(nearest.year - year) ? row : nearest;
  }, policyData[0]);
}

function latestVisibleEvent() {
  return [...policyEvents]
    .filter((event) => event.year <= policyState.currentYear)
    .sort((a, b) => b.year - a.year)[0];
}

function syncSelectedEventToNearestPast(year) {
  const nearestPast = [...policyEvents]
    .filter((event) => event.year <= year)
    .sort((a, b) => b.year - a.year)[0];

  if (nearestPast) {
    policyState.selectedEvent = nearestPast.policy_id;
  }
}

function updatePolicyInsight() {
  const currentRow = nearestRow(policyState.currentYear);
  const selectedEvent = policyEvents.find((item) => item.policy_id === policyState.selectedEvent);
  const latestEvent = latestVisibleEvent();
  const activeEvent = selectedEvent && selectedEvent.year <= policyState.currentYear ? selectedEvent : latestEvent;

  if (!activeEvent) {
    setInsight(
      "#insight-policy",
      `拖动时间线查看重大气候政策节点。当前停在 <strong>${policyState.currentYear}</strong> 年，全球 CO2 排放约为 <strong>${formatGt(currentRow.global_emissions)}</strong>。`
    );
    return;
  }

  const beforeAfter = buildTrendSentence(activeEvent);

  setInsight(
    "#insight-policy",
    `当前停在 <strong>${policyState.currentYear}</strong> 年，全球 CO2 排放约为 <strong>${formatGt(currentRow.global_emissions)}</strong>。最近政策节点是 <strong>${eventName(activeEvent)}</strong>（${activeEvent.year}）：${activeEvent.description} ${beforeAfter}`
  );
}

function hasNumber(value) {
  return value !== null && value !== undefined && !Number.isNaN(Number(value));
}

function eventName(event) {
  return event.policy_name_zh || event.policy_name;
}

function buildTrendSentence(event) {
  if (!hasNumber(event.emissions_before) || !hasNumber(event.emissions_after)) {
    return "";
  }

  const before = Number(event.emissions_before);
  const after = Number(event.emissions_after);
  const delta = after - before;
  const absDelta = Math.abs(delta);

  if (absDelta < 0.3) {
    return `从前后三年均值看，排放由 <strong>${formatGt(before)}</strong> 变化到 <strong>${formatGt(after)}</strong>，整体接近持平，说明这一节点附近还没有出现清晰的全球排放拐点。`;
  }

  if (delta >= 1) {
    return `从前后三年均值看，排放由 <strong>${formatGt(before)}</strong> 上升到 <strong>${formatGt(after)}</strong>，增幅约 <strong>${formatGt(delta)}</strong>。这表明该政策更像是治理进程的推进信号，而不是立刻压低全球排放的转折点。`;
  }

  if (delta > 0) {
    return `从前后三年均值看，排放由 <strong>${formatGt(before)}</strong> 小幅上升到 <strong>${formatGt(after)}</strong>。这一变化提示我们，政策达成和排放下降之间往往存在明显滞后。`;
  }

  if (delta <= -1) {
    return `从前后三年均值看，排放由 <strong>${formatGt(before)}</strong> 下降到 <strong>${formatGt(after)}</strong>，降幅约 <strong>${formatGt(Math.abs(delta))}</strong>。这个节点附近出现了较明显回落，但仍需要结合经济周期、能源结构和疫情等因素判断是否由政策直接驱动。`;
  }

  return `从前后三年均值看，排放由 <strong>${formatGt(before)}</strong> 小幅下降到 <strong>${formatGt(after)}</strong>。这可能意味着政策压力开始显现，但下降幅度仍不足以单独证明出现稳定拐点。`;
}
