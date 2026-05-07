import { loadCsv } from "../data-loader.js";
import { COLORS, DEFAULTS } from "../utils/constants.js";
import { formatGt } from "../utils/format.js";
import { setActiveTrigger, setInsight } from "../utils/dom.js";

const policyState = {
  selectedEvent: DEFAULTS.policyEvent
};

let policyData = [];

export async function initPolicyTimelineModule() {
  policyData = await loadCsv("data/processed/policy_events.csv");
  bindPolicyTextTriggers();
  renderPolicyChart();
  updatePolicyInsight();
}

function bindPolicyTextTriggers() {
  document.querySelectorAll('.narrative-trigger[data-module="policy"]').forEach((trigger) => {
    trigger.addEventListener("click", () => {
      policyState.selectedEvent = trigger.dataset.event;
      renderPolicyChart();
      updatePolicyInsight();
    });
  });
}

function renderPolicyChart() {
  const selected = policyData.find((item) => item.policy_id === policyState.selectedEvent);
  const selectedYear = selected ? selected.year : 2015;

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 380,
    data: { values: policyData },
    layer: [
      {
        mark: { type: "line", point: true, strokeWidth: 3 },
        encoding: {
          x: { field: "year", type: "ordinal", title: "年份" },
          y: { field: "global_emissions", type: "quantitative", title: "全球排放（GtCO2）" },
          color: { value: COLORS.teal },
          tooltip: [
            { field: "year", title: "年份" },
            { field: "global_emissions", title: "全球排放" }
          ]
        }
      },
      {
        transform: [{ filter: `datum.year == ${selectedYear}` }],
        mark: { type: "rule", strokeDash: [6, 4], strokeWidth: 2, color: COLORS.selected },
        encoding: {
          x: { field: "year", type: "ordinal" }
        }
      },
      {
        transform: [{ filter: "datum.policy_id != null" }],
        mark: { type: "point", filled: true, size: 180 },
        encoding: {
          x: { field: "year", type: "ordinal" },
          y: { field: "global_emissions", type: "quantitative" },
          color: {
            condition: {
              test: `datum.policy_id == '${policyState.selectedEvent}'`,
              value: COLORS.selected
            },
            value: COLORS.gold
          },
          tooltip: [
            { field: "policy_name", title: "政策" },
            { field: "description", title: "说明" }
          ]
        }
      },
      {
        transform: [{ filter: `datum.policy_id == '${policyState.selectedEvent}'` }],
        mark: { type: "text", dy: -18, fontWeight: "bold", color: COLORS.selected },
        encoding: {
          x: { field: "year", type: "ordinal" },
          y: { field: "global_emissions", type: "quantitative" },
          text: { field: "policy_name" }
        }
      }
    ],
    config: { view: { stroke: null }, axis: { labelFontSize: 12, titleFontSize: 13 } }
  };

  vegaEmbed("#chart-policy", spec, { actions: false });
  setActiveTrigger("policy", (trigger) => trigger.dataset.event === policyState.selectedEvent);
}

function updatePolicyInsight() {
  const event = policyData.find((item) => item.policy_id === policyState.selectedEvent);
  if (!event) {
    setInsight("#insight-policy", "暂无该政策事件的数据。");
    return;
  }

  setInsight(
    "#insight-policy",
    `<strong>${event.policy_name}</strong> 出现在 ${event.year} 年。示例数据中，政策前后排放从 <strong>${formatGt(event.emissions_before)}</strong> 变化到 <strong>${formatGt(event.emissions_after)}</strong>。`
  );
}
