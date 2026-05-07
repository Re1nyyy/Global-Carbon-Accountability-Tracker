import { loadCsv } from "../data-loader.js";
import { COLORS, DEFAULTS } from "../utils/constants.js";
import { formatGt } from "../utils/format.js";
import { setActiveTrigger, setInsight } from "../utils/dom.js";

const tradeState = {
  selectedMetric: DEFAULTS.tradeMetric
};

let tradeData = [];

const metricLabels = {
  production: "production_co2",
  consumption: "consumption_co2",
  net: "net_embodied_carbon"
};

export async function initTradeCarbonModule() {
  tradeData = await loadCsv("data/processed/trade_carbon.csv");
  bindTradeTextTriggers();
  renderTradeChart();
  updateTradeInsight();
}

function bindTradeTextTriggers() {
  document.querySelectorAll('.narrative-trigger[data-module="trade"]').forEach((trigger) => {
    trigger.addEventListener("click", () => {
      tradeState.selectedMetric = trigger.dataset.metric;
      renderTradeChart();
      updateTradeInsight();
    });
  });
}

function renderTradeChart() {
  const selectedField = metricLabels[tradeState.selectedMetric];
  const folded = tradeData.flatMap((row) => [
    { ...row, metric: "生产端排放", value: row.production_co2 },
    { ...row, metric: "消费端排放", value: row.consumption_co2 },
    { ...row, metric: "净进口碳", value: row.net_embodied_carbon }
  ]);

  const selectedLabel = {
    production_co2: "生产端排放",
    consumption_co2: "消费端排放",
    net_embodied_carbon: "净进口碳"
  }[selectedField];

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 380,
    data: { values: folded },
    mark: { type: "bar", cornerRadiusEnd: 3 },
    encoding: {
      x: { field: "country", type: "nominal", title: "国家", sort: "-y" },
      y: { field: "value", type: "quantitative", title: "排放（GtCO2）" },
      color: {
        condition: {
          test: `datum.metric == '${selectedLabel}'`,
          value: COLORS.selected
        },
        value: COLORS.muted
      },
      xOffset: { field: "metric" },
      tooltip: [
        { field: "country", title: "国家" },
        { field: "metric", title: "口径" },
        { field: "value", title: "数值" }
      ]
    },
    config: { view: { stroke: null }, axis: { labelFontSize: 12, titleFontSize: 13 } }
  };

  vegaEmbed("#chart-trade", spec, { actions: false });
  setActiveTrigger("trade", (trigger) => trigger.dataset.metric === tradeState.selectedMetric);
}

function updateTradeInsight() {
  const selectedField = metricLabels[tradeState.selectedMetric];
  const top = [...tradeData].sort((a, b) => b[selectedField] - a[selectedField])[0];
  const label = {
    production: "生产端排放",
    consumption: "消费端排放",
    net: "净进口碳"
  }[tradeState.selectedMetric];

  setInsight(
    "#insight-trade",
    `当前强调 <strong>${label}</strong>。示例数据中，该指标最高的是 <strong>${top.country}</strong>，数值约为 <strong>${formatGt(top[selectedField])}</strong>。`
  );
}
