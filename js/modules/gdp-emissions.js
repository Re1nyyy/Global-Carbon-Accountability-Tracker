import { loadCsv } from "../data-loader.js";
import { COLORS, DEFAULTS } from "../utils/constants.js";
import { formatGt, formatNumber, formatPercent } from "../utils/format.js";
import { setActiveTrigger, setInsight } from "../utils/dom.js";

const gdpState = {
  selectedCountry: DEFAULTS.gdpCountry,
  selectedYear: 2022,
  isPlaying: false,
  playTimer: null,
  animationFrame: null,
  animationToken: 0
};

const GDP_POINT_DATA = "gdpPoints";
const PLAY_YEAR_DURATION = 720;
const PLAY_YEAR_PAUSE = 90;

let gdpData = [];
let gdpYears = [];
let gdpView = null;
let gdpRenderPromise = null;
let gdpRenderQueued = false;
let gdpPendingRows = null;

export async function initGdpEmissionsModule() {
  gdpData = await loadCsv("data/processed/gdp_emissions.csv");
  gdpYears = [...new Set(gdpData.map((row) => row.year))].sort((a, b) => a - b);
  const yearSlider = document.querySelector("#gdp-year-slider");
  const initialYear = yearSlider?.value ? Number(yearSlider.value) : gdpState.selectedYear;
  gdpState.selectedYear = gdpYears.includes(initialYear) ? initialYear : gdpYears.at(-1);
  bindGdpTextTriggers();
  bindGdpControls();
  bindDecouplingDialog();
  bindGdpScrollSteps();
  updateGdpControls();
  await renderGdpChart();
  updateGdpInsight();
}

function bindGdpTextTriggers() {
  document.querySelectorAll('.narrative-trigger[data-module="gdp"]').forEach((trigger) => {
    trigger.addEventListener("click", () => {
      gdpState.selectedCountry = trigger.dataset.country;
      if (trigger.dataset.year) {
        gdpState.selectedYear = Number(trigger.dataset.year);
        stopGdpPlayback();
      }
      renderGdpChart();
      updateGdpControls();
      updateGdpInsight();
      setActiveTrigger("gdp", isGdpTriggerActive);
    });
  });
}

function bindGdpControls() {
  const playButton = document.querySelector("#gdp-play-button");
  const yearSlider = document.querySelector("#gdp-year-slider");

  if (playButton) {
    playButton.addEventListener("click", async () => {
      if (gdpState.isPlaying) {
        stopGdpPlayback();
      } else {
        if (gdpState.selectedYear >= getMaxGdpYear()) {
          gdpState.selectedYear = getMinGdpYear();
          updateGdpChartData(getYearRows(gdpState.selectedYear));
          updateGdpControls();
          updateGdpInsight();
          await waitForNextFrame();
        }
        startGdpPlayback();
      }
      updateGdpControls();
    });
  }

  if (yearSlider) {
    yearSlider.addEventListener("input", () => {
      stopGdpPlayback({ syncChart: false });
      setGdpYear(Number(yearSlider.value));
    });
  }
}

function bindDecouplingDialog() {
  const button = document.querySelector("#decoupling-help-button");
  const dialog = document.querySelector("#decoupling-dialog");
  const closeButton = document.querySelector("#decoupling-dialog-close");

  if (!button || !dialog) {
    return;
  }

  button.addEventListener("click", () => {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  });

  closeButton?.addEventListener("click", () => {
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && typeof dialog.close === "function") {
      dialog.close();
    }
  });
}

function bindGdpScrollSteps() {
  const steps = [...document.querySelectorAll("[data-gdp-scroll-year]")];
  if (!steps.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    steps.forEach((step) => {
      step.addEventListener("click", () => activateGdpScrollStep(step));
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (activeEntry) {
        activateGdpScrollStep(activeEntry.target);
      }
    },
    {
      root: null,
      rootMargin: "-35% 0px -40% 0px",
      threshold: [0.12, 0.35, 0.6]
    }
  );

  steps.forEach((step) => observer.observe(step));
}

function activateGdpScrollStep(step) {
  const targetYear = Number(step.dataset.gdpScrollYear);
  const targetCountry = step.dataset.gdpScrollCountry;
  if (!Number.isFinite(targetYear)) {
    return;
  }

  const nextYear = clampGdpYear(targetYear);
  const countryChanged = targetCountry && targetCountry !== gdpState.selectedCountry;
  const yearChanged = nextYear !== gdpState.selectedYear;
  if (!countryChanged && !yearChanged) {
    return;
  }

  stopGdpPlayback({ syncChart: false });
  if (targetCountry) {
    gdpState.selectedCountry = targetCountry;
  }
  gdpState.selectedYear = nextYear;
  updateGdpControls();
  updateGdpInsight();
  setActiveTrigger("gdp", isGdpTriggerActive);

  if (countryChanged) {
    renderGdpChart();
  } else {
    updateGdpChartData(getYearRows(gdpState.selectedYear));
  }
}

async function startGdpPlayback() {
  const maxYear = getMaxGdpYear();
  if (gdpState.selectedYear >= maxYear) {
    return;
  }

  gdpState.animationToken += 1;
  gdpState.isPlaying = true;
  setGdpChartPlayingClass(true);
  updateGdpChartData(getYearRows(gdpState.selectedYear));
  updateGdpControls();
  await waitForNextFrame();
  playNextGdpYear();
}

function stopGdpPlayback({ syncChart = true } = {}) {
  if (gdpState.playTimer) {
    window.clearTimeout(gdpState.playTimer);
  }
  if (gdpState.animationFrame) {
    window.cancelAnimationFrame(gdpState.animationFrame);
  }
  gdpState.animationToken += 1;
  gdpState.isPlaying = false;
  gdpState.playTimer = null;
  gdpState.animationFrame = null;
  setGdpChartPlayingClass(false);
  if (syncChart) {
    updateGdpChartData(getYearRows(gdpState.selectedYear));
  }
}

function setGdpYear(year) {
  gdpState.selectedYear = clampGdpYear(year);
  updateGdpChartData(getYearRows(gdpState.selectedYear));
  updateGdpControls();
  updateGdpInsight();
  setActiveTrigger("gdp", isGdpTriggerActive);
}

async function playNextGdpYear() {
  if (!gdpState.isPlaying) {
    return;
  }

  const maxYear = getMaxGdpYear();
  if (gdpState.selectedYear >= maxYear) {
    stopGdpPlayback();
    updateGdpControls();
    return;
  }

  const nextYear = gdpState.selectedYear + 1;
  const completed = await animateGdpYear(nextYear);
  if (!completed || !gdpState.isPlaying) {
    return;
  }

  gdpState.selectedYear = nextYear;
  updateGdpControls();
  updateGdpInsight();
  setActiveTrigger("gdp", isGdpTriggerActive);

  if (nextYear >= maxYear) {
    stopGdpPlayback();
    updateGdpControls();
    return;
  }

  gdpState.playTimer = window.setTimeout(playNextGdpYear, PLAY_YEAR_PAUSE);
}

function animateGdpYear(targetYear) {
  const fromYear = gdpState.selectedYear;
  const token = gdpState.animationToken;
  const startedAt = window.performance.now();

  updateGdpControlsForYear(targetYear);

  return new Promise((resolve) => {
    const tick = (now) => {
      if (token !== gdpState.animationToken || !gdpState.isPlaying) {
        resolve(false);
        return;
      }

      const progress = Math.min((now - startedAt) / PLAY_YEAR_DURATION, 1);
      const eased = easeInOutCubic(progress);
      updateGdpChartDataNow(interpolateYearRows(fromYear, targetYear, eased));

      if (progress < 1) {
        gdpState.animationFrame = window.requestAnimationFrame(tick);
      } else {
        updateGdpChartDataNow(getYearRows(targetYear));
        resolve(true);
      }
    };

    gdpState.animationFrame = window.requestAnimationFrame(tick);
  });
}

function updateGdpControls() {
  const playButton = document.querySelector("#gdp-play-button");
  const yearSlider = document.querySelector("#gdp-year-slider");
  const yearLabel = document.querySelector("#gdp-year-label");

  if (yearSlider && gdpYears.length) {
    yearSlider.min = String(getMinGdpYear());
    yearSlider.max = String(getMaxGdpYear());
    yearSlider.value = String(gdpState.selectedYear);
  }

  if (yearLabel) {
    yearLabel.textContent = `窗口期：${gdpState.selectedYear - 5}-${gdpState.selectedYear}`;
  }

  if (playButton) {
    playButton.textContent = gdpState.isPlaying
      ? "暂停"
      : gdpState.selectedYear >= getMaxGdpYear()
        ? "重播"
        : "播放";
    playButton.disabled = false;
  }
}

function updateGdpControlsForYear(year) {
  const yearSlider = document.querySelector("#gdp-year-slider");
  const yearLabel = document.querySelector("#gdp-year-label");

  if (yearSlider) {
    yearSlider.value = String(year);
  }

  if (yearLabel) {
    yearLabel.textContent = `窗口期：${year - 5}-${year}`;
  }
}

function getMinGdpYear() {
  return gdpYears[0] ?? gdpState.selectedYear;
}

function getMaxGdpYear() {
  return gdpYears.at(-1) ?? gdpState.selectedYear;
}

function clampGdpYear(year) {
  return Math.min(Math.max(year, getMinGdpYear()), getMaxGdpYear());
}

async function renderGdpChart() {
  if (gdpRenderPromise) {
    gdpRenderQueued = true;
    return gdpRenderPromise.then(() => {
      if (!gdpRenderQueued) {
        return undefined;
      }

      gdpRenderQueued = false;
      return renderGdpChart();
    });
  }

  gdpRenderPromise = renderGdpChartNow().finally(() => {
    gdpRenderPromise = null;
  });

  return gdpRenderPromise;
}

async function renderGdpChartNow() {
  const chartElement = document.querySelector("#chart-gdp");
  if (!chartElement) {
    return;
  }

  const yearData = cloneGdpRows(getYearRows(gdpState.selectedYear));
  const labelMark = ["China", "India"].includes(gdpState.selectedCountry)
    ? { type: "text", dx: 14, dy: -34, align: "left", fontWeight: "bold", color: COLORS.selected }
    : { type: "text", dy: -18, fontWeight: "bold", color: COLORS.selected };

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: Number(chartElement.dataset.chartHeight) || 430,
    autosize: { type: "fit", contains: "padding", resize: true },
    padding: { left: 6, top: 8, right: 92, bottom: 6 },
    data: { name: GDP_POINT_DATA, values: yearData },
    layer: [
      {
        data: { values: [{ x: -40, y: 0 }, { x: 90, y: 0 }] },
        mark: { type: "line", color: "#9b9589", strokeDash: [4, 4], strokeWidth: 1 },
        encoding: {
          x: { field: "x", type: "quantitative", scale: { domain: [-40, 90] } },
          y: { field: "y", type: "quantitative", scale: { domain: [-50, 90] } }
        }
      },
      {
        data: { values: [{ x: 0, y: -50 }, { x: 0, y: 90 }] },
        mark: { type: "line", color: "#9b9589", strokeDash: [4, 4], strokeWidth: 1 },
        encoding: {
          x: { field: "x", type: "quantitative", scale: { domain: [-40, 90] } },
          y: { field: "y", type: "quantitative", scale: { domain: [-50, 90] } }
        }
      },
      {
        data: { values: [{ x: -40, y: -40 }, { x: 90, y: 90 }] },
        mark: { type: "line", color: "#d3c9b8", strokeDash: [6, 6], strokeWidth: 1 },
        encoding: {
          x: { field: "x", type: "quantitative", scale: { domain: [-40, 90] } },
          y: { field: "y", type: "quantitative", scale: { domain: [-50, 90] } }
        }
      },
      {
        mark: { type: "point", filled: true, opacity: 0.86, cursor: gdpState.isPlaying ? "default" : "pointer" },
        encoding: {
          key: { field: "country" },
          x: {
            field: "gdp_growth_5y",
            type: "quantitative",
            title: "过去 5 年 GDP 增长率（%）",
            scale: { domain: [-40, 90] },
            axis: { grid: true, tickCount: 8 }
          },
          y: {
            field: "co2_growth_5y",
            type: "quantitative",
            title: "过去 5 年 CO2 排放增长率（%）",
            scale: { domain: [-50, 90] },
            axis: { grid: true, tickCount: 8 }
          },
          size: {
            field: "population",
            type: "quantitative",
            title: "人口（百万人）",
            scale: { domain: [10, 1500], range: [100, 4600] },
            legend: {
              title: "人口",
              labelLimit: 120,
              offset: 14,
              values: [10, 100, 1000],
              labelExpr: "datum.value == 10 ? '一千万' : datum.value == 100 ? '一亿' : datum.value == 1000 ? '十亿' : datum.label",
              symbolFillColor: COLORS.selected,
              symbolStrokeColor: COLORS.selected,
              symbolOpacity: 0.95
            }
          },
          color: {
            field: "region",
            type: "nominal",
            title: "洲属",
            scale: {
              domain: ["亚洲", "欧洲", "北美洲", "南美洲", "非洲", "大洋洲"],
              range: ["#c43b2f", "#1d6f78", "#b98b2f", "#7aa65a", "#735f2d", "#7b6fb2"]
            }
          },
          opacity: {
            condition: {
              test: `datum.country == '${gdpState.selectedCountry}'`,
              value: 1
            },
            value: 0.72
          },
          stroke: {
            condition: {
              test: `datum.country == '${gdpState.selectedCountry}'`,
              value: "#2a2925"
            },
            value: "white"
          },
          strokeWidth: {
            condition: {
              test: `datum.country == '${gdpState.selectedCountry}'`,
              value: 2.4
            },
            value: 0.8
          },
          tooltip: [
            { field: "country", title: "国家" },
            { field: "region", title: "洲属" },
            { field: "year", title: "当前年份" },
            { field: "gdp_ppp", title: "GDP PPP" },
            { field: "total_co2", title: "总排放" },
            { field: "co2_per_capita", title: "人均排放" },
            { field: "carbon_intensity", title: "碳强度" },
            { field: "gdp_growth_5y", title: "GDP 5 年增长率" },
            { field: "co2_growth_5y", title: "CO2 5 年增长率" },
            { field: "intensity_change_5y", title: "碳强度 5 年变化" },
            { field: "decoupling_status", title: "状态" }
          ]
        }
      },
      {
        transform: [{ filter: `datum.country == '${gdpState.selectedCountry}'` }],
        mark: labelMark,
        encoding: {
          key: { field: "country" },
          x: { field: "gdp_growth_5y", type: "quantitative", scale: { domain: [-40, 90] } },
          y: { field: "co2_growth_5y", type: "quantitative", scale: { domain: [-50, 90] } },
          text: { field: "country" }
        }
      }
    ],
    config: {
      view: { stroke: null },
      axis: { labelFontSize: 12, titleFontSize: 13 },
      legend: {
        labelFontSize: 13,
        titleFontSize: 15,
        titleFontWeight: "bold",
        symbolSize: 120,
        labelLimit: 96
      }
    }
  };

  const result = await vegaEmbed("#chart-gdp", spec, { actions: false });
  gdpView = result.view;
  result.view.addEventListener("click", (event, item) => {
    if (gdpState.isPlaying) {
      return;
    }

    if (item?.datum?.country) {
      gdpState.selectedCountry = item.datum.country;
      renderGdpChart();
      updateGdpInsight();
      setActiveTrigger("gdp", isGdpTriggerActive);
    }
  });
  setActiveTrigger("gdp", isGdpTriggerActive);

  if (gdpPendingRows) {
    const rows = gdpPendingRows;
    gdpPendingRows = null;
    applyGdpChartData(rows);
  }
}

function getYearRows(year) {
  return gdpData.filter((row) => row.year === year);
}

function updateGdpChartData(rows) {
  if (!gdpView || !window.vega) {
    gdpPendingRows = cloneGdpRows(rows);
    return renderGdpChart();
  }

  if (gdpRenderPromise) {
    gdpPendingRows = cloneGdpRows(rows);
    return gdpRenderPromise.then(() => {
      if (!gdpPendingRows) {
        return undefined;
      }

      const pendingRows = gdpPendingRows;
      gdpPendingRows = null;
      return applyGdpChartData(pendingRows);
    });
  }

  applyGdpChartData(rows);
  return Promise.resolve();
}

function updateGdpChartDataNow(rows) {
  if (!gdpView || !window.vega) {
    gdpPendingRows = cloneGdpRows(rows);
    renderGdpChart();
    return;
  }

  if (gdpRenderPromise) {
    gdpPendingRows = cloneGdpRows(rows);
    return;
  }

  applyGdpChartData(rows);
}

function applyGdpChartData(rows) {
  const changeset = buildGdpDataChangeset(cloneGdpRows(rows));
  gdpView.change(GDP_POINT_DATA, changeset).run();
}

function buildGdpDataChangeset(rows) {
  return window.vega.changeset().remove(() => true).insert(rows);
}

function cloneGdpRows(rows) {
  return rows.map((row) => ({ ...row }));
}

function interpolateYearRows(fromYear, toYear, progress) {
  const fromRows = new Map(getYearRows(fromYear).map((row) => [row.country, row]));
  const toRows = getYearRows(toYear);

  return toRows.map((toRow) => {
    const fromRow = fromRows.get(toRow.country);
    if (!fromRow) {
      return toRow;
    }

    return {
      ...toRow,
      year: toYear,
      gdp_growth_5y: interpolateNumber(fromRow.gdp_growth_5y, toRow.gdp_growth_5y, progress),
      co2_growth_5y: interpolateNumber(fromRow.co2_growth_5y, toRow.co2_growth_5y, progress),
      population: interpolateNumber(fromRow.population, toRow.population, progress)
    };
  });
}

function interpolateNumber(fromValue, toValue, progress) {
  return Number(fromValue) + (Number(toValue) - Number(fromValue)) * progress;
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - ((-2 * value + 2) ** 3) / 2;
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

function setGdpChartPlayingClass(isPlaying) {
  document.querySelector("#chart-gdp")?.classList.toggle("is-playing", isPlaying);
}

function isGdpTriggerActive(trigger) {
  const countryMatches = trigger.dataset.country === gdpState.selectedCountry;
  if (!countryMatches) {
    return false;
  }

  return !trigger.dataset.year || Number(trigger.dataset.year) === gdpState.selectedYear;
}

function updateGdpInsight() {
  const row = gdpData.find((item) => item.country === gdpState.selectedCountry && item.year === gdpState.selectedYear);
  if (!row) {
    setInsight("#insight-gdp", "暂无该国家的 GDP 与排放数据。");
    return;
  }

  setInsight(
    "#insight-gdp",
    `图中 <strong>${row.year}</strong> 年的 <strong>${row.country}</strong> 气泡代表 <strong>${row.year - 5}-${row.year}</strong> 年的变化。这 5 年内，GDP 增长约 <strong>${formatPercent(row.gdp_growth_5y)}</strong>，CO2 排放变化约 <strong>${formatPercent(row.co2_growth_5y)}</strong>，判定为 <strong>${row.decoupling_status}</strong>。当前总排放约为 <strong>${formatGt(row.total_co2)}</strong>，GDP PPP 约为 <strong>${formatNumber(row.gdp_ppp, 0)}</strong> 十亿美元，碳强度变化约 <strong>${formatPercent(row.intensity_change_5y)}</strong>。`
  );
}
