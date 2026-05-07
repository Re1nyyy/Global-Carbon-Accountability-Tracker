import { loadCsv } from "../data-loader.js";
import { COLORS, DEFAULTS } from "../utils/constants.js";
import { formatGt, formatNumber } from "../utils/format.js";
import { setActiveTrigger, setInsight } from "../utils/dom.js";

const gdpState = {
  selectedCountry: DEFAULTS.gdpCountry,
  selectedYear: 2022
};

let gdpData = [];

export async function initGdpEmissionsModule() {
  gdpData = await loadCsv("data/processed/gdp_emissions.csv");
  bindGdpTextTriggers();
  renderGdpChart();
  updateGdpInsight();
}

function bindGdpTextTriggers() {
  document.querySelectorAll('.narrative-trigger[data-module="gdp"]').forEach((trigger) => {
    trigger.addEventListener("click", () => {
      gdpState.selectedCountry = trigger.dataset.country;
      renderGdpChart();
      updateGdpInsight();
    });
  });
}

function renderGdpChart() {
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 390,
    data: { values: gdpData },
    transform: [{ filter: `datum.year == ${gdpState.selectedYear}` }],
    layer: [
      {
        mark: { type: "point", filled: true, opacity: 0.9 },
        encoding: {
          x: {
            field: "gdp_ppp",
            type: "quantitative",
            title: "GDP PPP（十亿美元）",
            scale: { type: "log" }
          },
          y: {
            field: "total_co2",
            type: "quantitative",
            title: "总碳排放（GtCO2）"
          },
          size: {
            field: "population",
            type: "quantitative",
            title: "人口（百万人）",
            scale: { range: [90, 1600] }
          },
          color: {
            condition: {
              test: `datum.country == '${gdpState.selectedCountry}'`,
              value: COLORS.selected
            },
            value: COLORS.muted
          },
          tooltip: [
            { field: "country", title: "国家" },
            { field: "gdp_ppp", title: "GDP PPP" },
            { field: "total_co2", title: "总排放" },
            { field: "carbon_intensity", title: "碳强度" },
            { field: "decoupling_status", title: "状态" }
          ]
        }
      },
      {
        transform: [{ filter: `datum.country == '${gdpState.selectedCountry}'` }],
        mark: { type: "text", dy: -18, fontWeight: "bold", color: COLORS.selected },
        encoding: {
          x: { field: "gdp_ppp", type: "quantitative", scale: { type: "log" } },
          y: { field: "total_co2", type: "quantitative" },
          text: { field: "country" }
        }
      }
    ],
    config: { view: { stroke: null }, axis: { labelFontSize: 12, titleFontSize: 13 } }
  };

  vegaEmbed("#chart-gdp", spec, { actions: false });
  setActiveTrigger("gdp", (trigger) => trigger.dataset.country === gdpState.selectedCountry);
}

function updateGdpInsight() {
  const row = gdpData.find((item) => item.country === gdpState.selectedCountry && item.year === gdpState.selectedYear);
  if (!row) {
    setInsight("#insight-gdp", "暂无该国家的 GDP 与排放数据。");
    return;
  }

  setInsight(
    "#insight-gdp",
    `<strong>${row.country}</strong> 在 ${row.year} 年的排放约为 <strong>${formatGt(row.total_co2)}</strong>，GDP PPP 约为 <strong>${formatNumber(row.gdp_ppp, 0)}</strong> 十亿美元，当前判定为 <strong>${row.decoupling_status}</strong>。`
  );
}
