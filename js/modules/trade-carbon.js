import { loadCsv } from "../data-loader.js";
import { formatGt } from "../utils/format.js";
import { setInsight } from "../utils/dom.js";

const YEAR_MIN = 2000;
const YEAR_MAX = 2023;
const WORLD_MAP_URL = "https://cdn.jsdelivr.net/npm/vega-datasets@2/data/world-110m.json";
const NET_DOMAIN_MIN = -3;
const NET_DOMAIN_MAX = 5;

const tradeState = {
  selectedMetric: "production",
  selectedYear: YEAR_MAX
};

let tradeData = [];
let activeView = null;
let pendingYearFrame = null;
let pendingResizeFrame = null;

const metricConfig = {
  production: {
    field: "production_co2_per_capita",
    sizeField: "production_co2",
    title: "领土排放",
    legendTitle: "人均领土排放（tCO2/person）",
    colorRange: ["#f0d8a8", "#c43b2f"],
    legendLabels: ["1", "20"],
    description: "颜色表示人均领土排放；浅灰色国家暂无消费端匹配数据。",
    number: "01",
    heading: "第一步：只看本国烟囱",
    body: "领土排放回答的是：这个国家境内生产商品时排了多少碳。它像是在数本国烟囱冒出的烟，但没有追问这些商品最后卖给了谁。"
  },
  consumption: {
    field: "consumption_co2_per_capita",
    sizeField: "consumption_co2",
    title: "消费足迹",
    legendTitle: "人均消费排放（tCO2/person）",
    colorRange: ["#d6e7e5", "#1d6f78"],
    legendLabels: ["1", "23"],
    description: "颜色表示人均消费足迹；浅灰色国家暂无消费端匹配数据。",
    number: "02",
    heading: "第二步：把购物车里的碳算回来",
    body: "消费足迹回答的是：这个国家的消费行为在全球范围内引起了多少排放。它扣除出口商品的排放，再加上进口商品在别国产生的排放。"
  },
  net: {
    field: "net_embodied_carbon_per_capita",
    sizeField: "abs_net_embodied_carbon",
    title: "碳责任转移",
    legendTitle: "人均净进口碳（tCO2/person）",
    colorRange: ["#1d6f78", "#f6efe0", "#c43b2f"],
    legendLabels: ["-3", "0", "+5"],
    description: "蓝色表示碳责任承担者，红色表示碳责任转嫁者；0 始终是中性色分界。",
    number: "03",
    heading: "第三步：谁在转嫁，谁在代工？",
    body: "碳责任转移比较消费足迹和领土排放。正值表示消费责任高于本国烟囱，是碳责任转嫁者；负值表示为他国消费承担了更多生产排放，是全球供应链中的代工承担者。"
  }
};

const countryNamesZh = {
  Argentina: "阿根廷",
  Australia: "澳大利亚",
  Austria: "奥地利",
  Bangladesh: "孟加拉国",
  Belgium: "比利时",
  Brazil: "巴西",
  Canada: "加拿大",
  Chile: "智利",
  China: "中国",
  Czechia: "捷克",
  Denmark: "丹麦",
  Egypt: "埃及",
  Finland: "芬兰",
  France: "法国",
  Germany: "德国",
  Greece: "希腊",
  Hungary: "匈牙利",
  India: "印度",
  Indonesia: "印度尼西亚",
  Iran: "伊朗",
  Ireland: "爱尔兰",
  Israel: "以色列",
  Italy: "意大利",
  Japan: "日本",
  Kazakhstan: "哈萨克斯坦",
  Malaysia: "马来西亚",
  Mexico: "墨西哥",
  Netherlands: "荷兰",
  "New Zealand": "新西兰",
  Nigeria: "尼日利亚",
  Norway: "挪威",
  Pakistan: "巴基斯坦",
  Philippines: "菲律宾",
  Poland: "波兰",
  Portugal: "葡萄牙",
  Romania: "罗马尼亚",
  Russia: "俄罗斯",
  "Saudi Arabia": "沙特阿拉伯",
  "South Africa": "南非",
  "South Korea": "韩国",
  Spain: "西班牙",
  Sweden: "瑞典",
  Switzerland: "瑞士",
  Thailand: "泰国",
  Turkey: "土耳其",
  Ukraine: "乌克兰",
  "United Arab Emirates": "阿拉伯联合酋长国",
  "United Kingdom": "英国",
  "United States": "美国",
  Vietnam: "越南"
};

const regionNamesZh = {
  Africa: "非洲",
  Asia: "亚洲",
  Europe: "欧洲",
  "Europe/Asia": "欧亚地区",
  "Middle East": "中东",
  "North America": "北美洲",
  Oceania: "大洋洲",
  "South America": "南美洲"
};

export async function initTradeCarbonModule() {
  tradeData = await loadCsv("data/processed/trade_carbon.csv");
  bindMetricControls();
  bindYearControl();
  bindResizeHandler();
  updateTradeNarrative();
  updateTradeLegend();
  renderTradeMap();
  updateTradeLens();
  updateTradeInsight();
}

function bindMetricControls() {
  document.querySelectorAll("[data-metric]").forEach((control) => {
    control.addEventListener("click", () => {
      setTradeMetric(control.dataset.metric);
    });
  });
}

function bindYearControl() {
  const slider = document.querySelector("#trade-year");
  const label = document.querySelector("#trade-year-label");

  if (!slider || !label) {
    return;
  }

  slider.min = YEAR_MIN;
  slider.max = YEAR_MAX;
  slider.value = tradeState.selectedYear;
  label.textContent = tradeState.selectedYear;

  slider.addEventListener("input", () => {
    tradeState.selectedYear = Number(slider.value);
    label.textContent = tradeState.selectedYear;
    scheduleYearUpdate();
  });
}

function setTradeMetric(metric) {
  if (!metricConfig[metric] || metric === tradeState.selectedMetric) {
    return;
  }

  tradeState.selectedMetric = metric;
  updateTradeNarrative();
  updateTradeLegend();
  renderTradeMap();
  updateTradeLens();
  updateTradeInsight();
}

function updateTradeNarrative() {
  const config = metricConfig[tradeState.selectedMetric];
  const container = document.querySelector("#trade-current-view");

  if (container) {
    container.innerHTML = `
      <span class="trade-current-view__number">${config.number}</span>
      <h3>${config.heading}</h3>
      <p>${config.body}</p>
    `;
  }

  document.querySelectorAll("[data-metric]").forEach((control) => {
    control.classList.toggle("is-active", control.dataset.metric === tradeState.selectedMetric);
  });
}

function updateTradeLegend() {
  const config = metricConfig[tradeState.selectedMetric];
  const legend = document.querySelector("#trade-map-legend");

  if (!legend) {
    return;
  }

  legend.style.setProperty("--trade-legend-gradient", `linear-gradient(90deg, ${config.colorRange.join(", ")})`);
  legend.innerHTML = `
    <div class="trade-map-legend__title">${config.legendTitle}</div>
    <div class="trade-map-legend__bar"></div>
    <div class="trade-map-legend__labels">
      ${config.legendLabels.map((label) => `<span>${label}</span>`).join("")}
    </div>
  `;
}

function getYearData() {
  return tradeData
    .filter((row) => row.year === tradeState.selectedYear)
    .map((row) => ({
      ...row,
      country_zh: countryNamesZh[row.country] ?? row.country,
      region_zh: regionNamesZh[row.region] ?? row.region,
      abs_net_embodied_carbon: Math.abs(row.net_embodied_carbon),
      abs_net_embodied_carbon_per_capita: Math.abs(row.net_embodied_carbon_per_capita),
      responsibility_label: getResponsibilityLabel(row)
    }));
}

function renderTradeMap() {
  const rows = getYearData();
  const config = metricConfig[tradeState.selectedMetric];
  const mapLayout = getMapLayout();

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: {
      text: config.title,
      subtitle: config.description,
      anchor: "start",
      fontSize: 17,
      subtitleFontSize: 12,
      subtitleColor: "#62615d"
    },
    width: "container",
    height: mapLayout.height,
    projection: { type: "equalEarth", translate: mapLayout.translate, scale: mapLayout.scale },
    datasets: {
      tradeValues: rows
    },
    layer: [
      {
        data: {
          url: WORLD_MAP_URL,
          format: { type: "topojson", feature: "countries" }
        },
        mark: { type: "geoshape", fill: "#eeeeee", stroke: "#fffdf8", strokeWidth: 0.65 }
      },
      {
        data: {
          url: WORLD_MAP_URL,
          format: { type: "topojson", feature: "countries" }
        },
        transform: [
          {
            lookup: "id",
            from: {
              data: { name: "tradeValues" },
              key: "iso_num",
              fields: [
                "country",
                "country_zh",
                "iso3",
                "year",
                "region",
                "region_zh",
                "production_co2",
                "consumption_co2",
                "net_embodied_carbon",
                "production_co2_per_capita",
                "consumption_co2_per_capita",
                "net_embodied_carbon_per_capita",
                "responsibility_label"
              ]
            }
          },
          { filter: "isValid(datum.country)" }
        ],
        mark: { type: "geoshape", stroke: "#fffdf8", strokeWidth: 0.65 },
        encoding: {
          color: getColorEncoding(config),
          tooltip: [
            { field: "country_zh", title: "国家" },
            { field: "region_zh", title: "地区" },
            { field: "year", title: "年份" },
            { field: "production_co2_per_capita", title: "人均领土排放（tCO2/person）", format: ".2f" },
            { field: "consumption_co2_per_capita", title: "人均消费排放（tCO2/person）", format: ".2f" },
            { field: "net_embodied_carbon_per_capita", title: "人均净进口碳（tCO2/person）", format: "+.2f" },
            { field: "production_co2", title: "领土排放总量（GtCO2）", format: ".3f" },
            { field: "consumption_co2", title: "消费端排放总量（GtCO2）", format: ".3f" },
            { field: "net_embodied_carbon", title: "净进口碳总量（GtCO2）", format: "+.3f" },
            { field: "responsibility_label", title: "责任类型" }
          ]
        }
      }
    ],
    config: {
      view: { stroke: null },
      legend: { disable: true }
    }
  };

  vegaEmbed("#chart-trade", spec, { actions: false }).then((result) => {
    activeView = result.view;
    activeView.addEventListener("mouseover", (_event, item) => {
      if (item?.datum?.iso3) {
        updateTradeInsight(item.datum);
      }
    });
    activeView.addEventListener("mouseout", () => updateTradeInsight());
  });
}

function scheduleYearUpdate() {
  if (pendingYearFrame) {
    window.cancelAnimationFrame(pendingYearFrame);
  }

  pendingYearFrame = window.requestAnimationFrame(() => {
    pendingYearFrame = null;
    updateTradeMapData();
    updateTradeLens();
    updateTradeInsight();
  });
}

function updateTradeMapData() {
  if (!activeView || !window.vega?.changeset) {
    renderTradeMap();
    return;
  }

  try {
    const changes = window.vega
      .changeset()
      .remove(() => true)
      .insert(getYearData());

    activeView.change("tradeValues", changes).runAsync().catch(() => renderTradeMap());
  } catch {
    renderTradeMap();
  }
}

function getColorEncoding(config) {
  if (tradeState.selectedMetric === "net") {
    return {
      field: config.field,
      type: "quantitative",
      title: config.legendTitle,
      scale: {
        domain: [NET_DOMAIN_MIN, 0, NET_DOMAIN_MAX],
        range: config.colorRange,
        clamp: true
      }
    };
  }

  return {
    field: config.field,
    type: "quantitative",
    title: config.legendTitle,
    scale: { range: config.colorRange }
  };
}

function updateTradeLens() {
  const rows = getYearData();
  const lens = document.querySelector("#trade-lens");

  if (!lens) {
    return;
  }

  const lensConfig = getLensConfig(rows);

  lens.innerHTML = `
    <article class="trade-lens__item">
      <div class="trade-lens__label">${lensConfig.highTitle}</div>
      <ol class="trade-lens__list">
        ${lensConfig.highRows.map((row) => `<li><span>${row.country_zh}</span><strong>${lensConfig.format(row)}</strong></li>`).join("")}
      </ol>
    </article>
    <article class="trade-lens__item">
      <div class="trade-lens__label">${lensConfig.lowTitle}</div>
      <ol class="trade-lens__list">
        ${lensConfig.lowRows.map((row) => `<li><span>${row.country_zh}</span><strong>${lensConfig.format(row)}</strong></li>`).join("")}
      </ol>
    </article>
  `;
}

function getLensConfig(rows) {
  if (tradeState.selectedMetric === "production") {
    const sorted = [...rows].sort((a, b) => b.production_co2_per_capita - a.production_co2_per_capita);
    return {
      highTitle: "人均领土排放最多 Top5",
      lowTitle: "人均领土排放最少 Top5",
      highRows: sorted.slice(0, 5),
      lowRows: sorted.slice(-5).reverse(),
      format: (row) => formatTonnesPerPerson(row.production_co2_per_capita)
    };
  }

  if (tradeState.selectedMetric === "consumption") {
    const sorted = [...rows].sort((a, b) => b.consumption_co2_per_capita - a.consumption_co2_per_capita);
    return {
      highTitle: "人均消费足迹最多 Top5",
      lowTitle: "人均消费足迹最少 Top5",
      highRows: sorted.slice(0, 5),
      lowRows: sorted.slice(-5).reverse(),
      format: (row) => formatTonnesPerPerson(row.consumption_co2_per_capita)
    };
  }

  const sorted = [...rows].sort((a, b) => b.net_embodied_carbon_per_capita - a.net_embodied_carbon_per_capita);
  return {
    highTitle: "碳转嫁最多 Top5",
    lowTitle: "碳承担最多 Top5",
    highRows: sorted.slice(0, 5),
    lowRows: sorted.slice(-5).reverse(),
    format: (row) => formatSignedTonnesPerPerson(row.net_embodied_carbon_per_capita)
  };
}

function bindResizeHandler() {
  window.addEventListener("resize", () => {
    if (pendingResizeFrame) {
      window.cancelAnimationFrame(pendingResizeFrame);
    }

    pendingResizeFrame = window.requestAnimationFrame(() => {
      pendingResizeFrame = null;
      renderTradeMap();
    });
  });
}

function getMapLayout() {
  const container = document.querySelector("#chart-trade");
  const width = Math.max(300, container?.clientWidth ?? 680);
  const isMobile = width < 560;
  const height = isMobile ? Math.max(210, Math.min(270, width * 0.66)) : 330;
  const scale = isMobile ? width * 0.155 : Math.min(112, width * 0.16);
  const translate = [width / 2, isMobile ? height / 2 + 8 : 190];

  return { height, scale, translate };
}

function updateTradeInsight(hoveredCountry = null) {
  const rows = getYearData();
  const config = metricConfig[tradeState.selectedMetric];

  if (hoveredCountry) {
    updateHoveredCountryInsight(rows, hoveredCountry);
    return;
  }

  if (tradeState.selectedMetric === "production") {
    const top = [...rows].sort((a, b) => b.production_co2_per_capita - a.production_co2_per_capita)[0];
    setInsight(
      "#insight-trade",
      `${tradeState.selectedYear} 年先看 <strong>领土排放</strong>：这是一种“烟囱在哪里”的算法。样本中人均本土生产排放最高的是 <strong>${top.country_zh}</strong>，约 <strong>${formatTonnesPerPerson(top.production_co2_per_capita)}</strong>。但这还不能说明谁最终消费了这些高碳商品。`
    );
  } else if (tradeState.selectedMetric === "consumption") {
    const topGap = [...rows].sort((a, b) => b.net_embodied_carbon_per_capita - a.net_embodied_carbon_per_capita)[0];
    setInsight(
      "#insight-trade",
      `${tradeState.selectedYear} 年再看 <strong>消费足迹</strong>：进口商品里的隐含碳被计回消费者。此时 <strong>${topGap.country_zh}</strong> 的人均消费责任比本土生产责任高出 <strong>${formatSignedTonnesPerPerson(topGap.net_embodied_carbon_per_capita)}</strong>，说明“绿色”可能只是被供应链藏了起来。`
    );
  } else {
    const importer = [...rows].sort((a, b) => b.net_embodied_carbon_per_capita - a.net_embodied_carbon_per_capita)[0];
    const exporter = [...rows].sort((a, b) => a.net_embodied_carbon_per_capita - b.net_embodied_carbon_per_capita)[0];
    setInsight(
      "#insight-trade",
      `${tradeState.selectedYear} 年最后看 <strong>碳责任转移</strong>：正值是转嫁者，负值是代工承担者。<strong>${importer.country_zh}</strong> 是主要人均隐含碳净进口方（${formatSignedTonnesPerPerson(importer.net_embodied_carbon_per_capita)}），<strong>${exporter.country_zh}</strong> 则承担了更多服务他国消费的生产排放（${formatSignedTonnesPerPerson(exporter.net_embodied_carbon_per_capita)}）。碳中和不应只是账面上的挪移。`
    );
  }
}

function updateHoveredCountryInsight(rows, country) {
  const countryName = country.country_zh ?? country.country;

  if (tradeState.selectedMetric === "production") {
    const totalRank = getRank(rows, country.iso3, "production_co2");
    const perCapitaRank = getRank(rows, country.iso3, "production_co2_per_capita");
    setInsight(
      "#insight-trade",
      `<strong>${countryName}</strong> 在 ${country.year} 年的领土排放总量为 <strong>${formatGt(country.production_co2)}</strong>，在当前样本国家中排名 <strong>第 ${totalRank} 位</strong>；人均领土排放为 <strong>${formatTonnesPerPerson(country.production_co2_per_capita)}</strong>，排名 <strong>第 ${perCapitaRank} 位</strong>。`
    );
    return;
  }

  if (tradeState.selectedMetric === "consumption") {
    const totalRank = getRank(rows, country.iso3, "consumption_co2");
    const perCapitaRank = getRank(rows, country.iso3, "consumption_co2_per_capita");
    setInsight(
      "#insight-trade",
      `<strong>${countryName}</strong> 在 ${country.year} 年的消费足迹总量为 <strong>${formatGt(country.consumption_co2)}</strong>，在当前样本国家中排名 <strong>第 ${totalRank} 位</strong>；人均消费足迹为 <strong>${formatTonnesPerPerson(country.consumption_co2_per_capita)}</strong>，排名 <strong>第 ${perCapitaRank} 位</strong>。`
    );
    return;
  }

  setInsight(
    "#insight-trade",
    `<strong>${countryName}</strong> 在 ${country.year} 年的人均领土排放为 <strong>${formatTonnesPerPerson(country.production_co2_per_capita)}</strong>，人均消费排放为 <strong>${formatTonnesPerPerson(country.consumption_co2_per_capita)}</strong>，人均净进口碳为 <strong>${formatSignedTonnesPerPerson(country.net_embodied_carbon_per_capita)}</strong>。总量净进口碳为 <strong>${formatSignedGt(country.net_embodied_carbon)}</strong>。${getResponsibilitySentence(country)}`
  );
}

function getRank(rows, iso3, field) {
  return [...rows]
    .sort((a, b) => b[field] - a[field])
    .findIndex((row) => row.iso3 === iso3) + 1;
}

function getResponsibilityLabel(row) {
  if (row.responsibility_type === "net_importer") {
    return "隐含碳净进口方";
  }
  if (row.responsibility_type === "net_exporter") {
    return "隐含碳净出口方";
  }
  return "生产与消费责任接近平衡";
}

function getResponsibilitySentence(row) {
  const countryName = row.country_zh ?? row.country;
  if (row.net_embodied_carbon_per_capita > 0) {
    return `<strong>${countryName}</strong> 是转嫁者。`;
  }
  if (row.net_embodied_carbon_per_capita < 0) {
    return `<strong>${countryName}</strong> 是承担者。`;
  }
  return `<strong>${countryName}</strong> 的本土生产责任和消费责任大体接近。`;
}

function formatSignedGt(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatGt(value)}`;
}

function formatTonnesPerPerson(value) {
  return `${Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} tCO2/person`;
}

function formatSignedTonnesPerPerson(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatTonnesPerPerson(value)}`;
}
