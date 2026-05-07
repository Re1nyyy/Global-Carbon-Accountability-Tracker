import { loadCsv } from "../data-loader.js";
import { COLORS, DEFAULTS } from "../utils/constants.js";
import { formatGt, formatPercent } from "../utils/format.js";
import { setActiveTrigger, setInsight, showEmpty } from "../utils/dom.js";

const majorsState = {
  selectedCountry: DEFAULTS.majorsCountry,
  selectedYear: 2022
};

let majorsData = [];

export async function initCarbonMajorsModule() {
  majorsData = await loadCsv("data/processed/carbon_majors.csv");
  bindMajorsTextTriggers();
  renderMajorsChart();
  updateMajorsInsight();
}

function bindMajorsTextTriggers() {
  document.querySelectorAll('.narrative-trigger[data-module="majors"]').forEach((trigger) => {
    trigger.addEventListener("click", () => {
      majorsState.selectedCountry = trigger.dataset.country;
      renderMajorsChart();
      updateMajorsInsight();
    });
  });
}

function renderMajorsChart() {
  const rows = majorsData
    .filter((row) => row.country === majorsState.selectedCountry && row.year === majorsState.selectedYear)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);

  if (rows.length === 0) {
    showEmpty("#chart-majors", `暂无 ${majorsState.selectedCountry} 的企业排放数据。`);
    return;
  }

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 380,
    data: { values: rows },
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      y: { field: "company", type: "nominal", title: "企业", sort: "-x" },
      x: { field: "emissions", type: "quantitative", title: "排放（GtCO2）" },
      color: { field: "sector", type: "nominal", title: "行业" },
      tooltip: [
        { field: "company", title: "企业" },
        { field: "sector", title: "行业" },
        { field: "emissions", title: "排放" },
        { field: "share", title: "份额" }
      ]
    },
    config: {
      view: { stroke: null },
      axis: { labelFontSize: 12, titleFontSize: 13 },
      range: { category: [COLORS.selected, COLORS.teal, COLORS.gold, COLORS.brown, "#7a8f5b"] }
    }
  };

  vegaEmbed("#chart-majors", spec, { actions: false });
  setActiveTrigger("majors", (trigger) => trigger.dataset.country === majorsState.selectedCountry);
}

function updateMajorsInsight() {
  const rows = majorsData
    .filter((row) => row.country === majorsState.selectedCountry && row.year === majorsState.selectedYear)
    .sort((a, b) => a.rank - b.rank);

  if (rows.length === 0) {
    setInsight("#insight-majors", `暂无 <strong>${majorsState.selectedCountry}</strong> 的企业排放数据。`);
    return;
  }

  const top = rows[0];
  setInsight(
    "#insight-majors",
    `<strong>${majorsState.selectedCountry}</strong> 的示例 Top 5 中，排在第一的是 <strong>${top.company}</strong>，排放约为 <strong>${formatGt(top.emissions)}</strong>，占比 <strong>${formatPercent(top.share)}</strong>。`
  );
}
