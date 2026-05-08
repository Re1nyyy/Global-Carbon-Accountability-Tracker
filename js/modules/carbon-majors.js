import { loadCsv } from "../data-loader.js";
import { COLORS } from "../utils/constants.js";
import { formatGt } from "../utils/format.js";
import { setInsight } from "../utils/dom.js";

// 全球国家/地区 ISO 3166-1 数字代码 → 中文名称（覆盖 world-110m.json 全部 177 个政区）
const ISO_TO_ZH = {
  "4":"阿富汗","8":"阿尔巴尼亚","12":"阿尔及利亚","20":"安道尔","24":"安哥拉","28":"安提瓜和巴布达",
  "31":"阿塞拜疆","32":"阿根廷","36":"澳大利亚","40":"奥地利","44":"巴哈马","48":"巴林",
  "50":"孟加拉国","51":"亚美尼亚","52":"巴巴多斯","56":"比利时","60":"百慕大","64":"不丹",
  "68":"玻利维亚","70":"波黑","72":"博茨瓦纳","76":"巴西","84":"伯利兹","90":"所罗门群岛",
  "96":"文莱","100":"保加利亚","104":"缅甸","108":"布隆迪","112":"白俄罗斯","116":"柬埔寨",
  "120":"喀麦隆","124":"加拿大","132":"佛得角","136":"开曼群岛","140":"中非","144":"斯里兰卡",
  "148":"乍得","152":"智利","156":"中国","158":"中国台湾","170":"哥伦比亚","174":"科摩罗",
  "178":"刚果（布）","180":"刚果（金）","188":"哥斯达黎加","191":"克罗地亚","192":"古巴",
  "196":"塞浦路斯","203":"捷克","204":"贝宁","208":"丹麦","212":"多米尼克","214":"多米尼加",
  "218":"厄瓜多尔","222":"萨尔瓦多","226":"赤道几内亚","231":"埃塞俄比亚","232":"厄立特里亚",
  "233":"爱沙尼亚","234":"法罗群岛","238":"福克兰群岛","242":"斐济","246":"芬兰","250":"法国",
  "254":"法属圭亚那","258":"法属波利尼西亚","262":"吉布提","266":"加蓬","268":"格鲁吉亚",
  "270":"冈比亚","275":"巴勒斯坦","276":"德国","288":"加纳","292":"直布罗陀","296":"基里巴斯",
  "300":"希腊","304":"格陵兰","308":"格林纳达","312":"瓜德罗普","316":"关岛","320":"危地马拉",
  "324":"几内亚","328":"圭亚那","332":"海地","336":"梵蒂冈","340":"洪都拉斯","344":"中国香港",
  "348":"匈牙利","352":"冰岛","356":"印度","360":"印度尼西亚","364":"伊朗","368":"伊拉克",
  "372":"爱尔兰","376":"以色列","380":"意大利","384":"科特迪瓦","388":"牙买加","392":"日本",
  "398":"哈萨克斯坦","400":"约旦","404":"肯尼亚","408":"朝鲜","410":"韩国","414":"科威特",
  "417":"吉尔吉斯斯坦","418":"老挝","422":"黎巴嫩","426":"莱索托","428":"拉脱维亚","430":"利比里亚",
  "434":"利比亚","438":"列支敦士登","440":"立陶宛","442":"卢森堡","446":"中国澳门","450":"马达加斯加",
  "454":"马拉维","458":"马来西亚","462":"马尔代夫","466":"马里","470":"马耳他","474":"马提尼克",
  "478":"毛里塔尼亚","480":"毛里求斯","484":"墨西哥","492":"摩纳哥","496":"蒙古","498":"摩尔多瓦",
  "499":"黑山","500":"蒙特塞拉特","504":"摩洛哥","508":"莫桑比克","512":"阿曼","516":"纳米比亚",
  "520":"瑙鲁","524":"尼泊尔","528":"荷兰","531":"库拉索","533":"阿鲁巴","534":"荷属圣马丁",
  "540":"新喀里多尼亚","548":"瓦努阿图","554":"新西兰","558":"尼加拉瓜","562":"尼日尔",
  "566":"尼日利亚","570":"纽埃","574":"诺福克岛","578":"挪威","580":"北马里亚纳群岛",
  "583":"密克罗尼西亚联邦","584":"马绍尔群岛","585":"帕劳","586":"巴基斯坦","591":"巴拿马",
  "598":"巴布亚新几内亚","600":"巴拉圭","604":"秘鲁","608":"菲律宾","612":"皮特凯恩群岛",
  "616":"波兰","620":"葡萄牙","624":"几内亚比绍","626":"东帝汶","630":"波多黎各","634":"卡塔尔",
  "638":"留尼汪","642":"罗马尼亚","643":"俄罗斯","646":"卢旺达","652":"圣巴泰勒米","654":"圣赫勒拿",
  "659":"圣基茨和尼维斯","660":"安圭拉","662":"圣卢西亚","663":"法属圣马丁","666":"圣皮埃尔和密克隆",
  "670":"圣文森特和格林纳丁斯","674":"圣马力诺","678":"圣多美和普林西比","682":"沙特阿拉伯",
  "686":"塞内加尔","688":"塞尔维亚","690":"塞舌尔","694":"塞拉利昂","702":"新加坡","703":"斯洛伐克",
  "704":"越南","705":"斯洛文尼亚","706":"索马里","710":"南非","716":"津巴布韦","724":"西班牙",
  "728":"南苏丹","729":"苏丹","732":"西撒哈拉","740":"苏里南","744":"斯瓦尔巴和扬马延",
  "748":"斯威士兰","752":"瑞典","756":"瑞士","760":"叙利亚","762":"塔吉克斯坦","764":"泰国",
  "768":"多哥","772":"托克劳","776":"汤加","780":"特立尼达和多巴哥","784":"阿联酋","788":"突尼斯",
  "792":"土耳其","795":"土库曼斯坦","796":"特克斯和凯科斯群岛","798":"图瓦卢","800":"乌干达",
  "804":"乌克兰","807":"北马其顿","818":"埃及","826":"英国","831":"根西岛","832":"泽西岛",
  "833":"马恩岛","834":"坦桑尼亚","840":"美国","850":"美属维尔京群岛","854":"布基纳法索",
  "858":"乌拉圭","860":"乌兹别克斯坦","862":"委内瑞拉","876":"瓦利斯和富图纳","882":"萨摩亚",
  "887":"也门","894":"赞比亚"
};

let majorsData = [];
let globalAvg = 0;
let vegaViewMap = null;
let vegaViewBar = null;
let currentSelectedCountry = null;
let countryMap = [];
let sectorDomain = [];
let sectorRange = [];

const SECTOR_PALETTE = [COLORS.brown, COLORS.selected, COLORS.teal, COLORS.gold, "#6a8c5c", "#8b5e3c"];

export async function initCarbonMajorsModule() {
  majorsData = await loadCsv("data/processed/carbon_majors.csv");

  // 强制转换数值字段，容错空值，避免 NaN / undefined 进入渲染
  majorsData.forEach((r) => {
    r.emissions = Number(r.emissions) || 0;
    r.share = Number(r.share) || 0;
  });

  // 计算各国上榜企业排放总和（用于分级统计地图）
  const countryTotals = new Map();
  for (const r of majorsData) {
    const iso = String(r.iso_num);
    countryTotals.set(iso, (countryTotals.get(iso) || 0) + (Number(r.emissions) || 0));
  }

  // 构建全量国家映射（覆盖 world-110m.json 全部政区，确保灰色国家也可点击交互）
  // CSV 中的中文名优先；无数据国家回退至 ISO_TO_ZH 字典
  const csvCountryMap = new Map();
  for (const r of majorsData) {
    csvCountryMap.set(String(r.iso_num), r.country);
  }
  const seen = new Set();
  countryMap = [];
  for (const [iso, zh] of Object.entries(ISO_TO_ZH)) {
    countryMap.push({
      iso_num: iso,
      country: csvCountryMap.get(iso) || zh,
      has_data: csvCountryMap.has(iso),
      total_emissions: countryTotals.get(iso) || 0
    });
    seen.add(iso);
  }
  // 补充 CSV 中存在但 ISO_TO_ZH 未覆盖的边缘 case（如数据更新新增国家）
  for (const r of majorsData) {
    const iso = String(r.iso_num);
    if (!seen.has(iso)) {
      countryMap.push({
        iso_num: iso,
        country: r.country,
        has_data: true,
        total_emissions: countryTotals.get(iso) || 0
      });
      seen.add(iso);
    }
  }

  // 计算全库全球平均排放（残酷基准线）
  const allTotal = majorsData.reduce((s, r) => s + (Number(r.emissions) || 0), 0);
  globalAvg = allTotal / majorsData.length;

  // 动态提取行业种类并分配颜色
  const sectors = [...new Set(majorsData.map((r) => r.sector))].sort();
  sectorDomain = sectors;
  sectorRange = sectors.map((_, i) => SECTOR_PALETTE[i % SECTOR_PALETTE.length]);

  try { await renderBoth(); } catch (e) { console.error("[carbon-majors] renderBoth failed:", e); }
  syncAll("World");
}

async function renderBoth() {
  try { await renderMap(); } catch (e) { console.error("[carbon-majors] renderMap failed:", e); }
  try { await renderBar(); } catch (e) { console.error("[carbon-majors] renderBar failed:", e); }
  setupToggle();
}

async function renderMap() {
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 500,
    autosize: { type: "fit-x", contains: "padding" },
    padding: { left: 10, right: 40, top: 10, bottom: 10 },
    data: { url: "https://cdn.jsdelivr.net/npm/vega-datasets@v1.29.0/data/world-110m.json", format: { type: "topojson", feature: "countries" } },
    transform: [
      { lookup: "id", from: { data: { values: countryMap }, key: "iso_num", fields: ["country", "has_data", "total_emissions"] } },
      { calculate: "datum.has_data ? '有上榜企业' : '无上榜记录'", as: "data_status" }
    ],
    projection: { type: "equalEarth" },
    params: [
      { name: "click_country", select: { type: "point", fields: ["country"] } }
    ],
    mark: { type: "geoshape" },
    encoding: {
      color: {
        condition: { test: "!datum.has_data", value: "#e8e4dd" },
        field: "total_emissions",
        type: "quantitative",
        scale: { scheme: "oranges", type: "symlog" },
        legend: { title: "国家上榜巨头总排量 (GtCO₂)", orient: "bottom", format: ".1f" }
      },
      fillOpacity: {
        condition: [
          { param: "click_country", empty: true, value: 1 },
          { param: "click_country", empty: false, value: 1 }
        ],
        value: 0.35
      },
      stroke: {
        condition: { param: "click_country", empty: false, value: "#00e5ff" },
        value: "#ffffff"
      },
      strokeWidth: {
        condition: { param: "click_country", empty: false, value: 2.5 },
        value: 0.5
      },
      tooltip: [
        { field: "country", type: "nominal", title: "国家" },
        { field: "data_status", type: "nominal", title: "巨头总部" },
        { field: "total_emissions", type: "quantitative", title: "总排量 (GtCO₂)", format: ".2f" }
      ]
    },
    config: { view: { stroke: null } }
  };

  const result = await vegaEmbed("#vis-majors-map", spec, { actions: false });
  vegaViewMap = result.view;

  vegaViewMap.addSignalListener("click_country", (_, value) => {
    console.log("[carbon-majors] map clicked:", value);
    const selected = extractCountry(value);
    console.log("[carbon-majors] extracted country:", selected);
    currentSelectedCountry = selected;
    syncAll(selected || "World");
    syncBarSelection(selected);
  });
}

async function renderBar() {
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 450,
    autosize: { type: "fit-x", contains: "padding" },
    padding: { left: 10, right: 40, top: 10, bottom: 10 },
    data: { values: majorsData },
    params: [
      { name: "selected_country", value: null }
    ],
    transform: [
      { filter: "selected_country == null || datum.country == selected_country" },
      { window: [{ op: "rank", as: "rank" }], sort: [{ field: "emissions", order: "descending" }] },
      { filter: "datum.rank <= 5" }
    ],
    layer: [
      {
        mark: { type: "bar", cornerRadiusEnd: 4, size: 30 },
        encoding: {
          y: { field: "company", type: "nominal", sort: "-x", title: null, axis: { labelLimit: 150 } },
          x: { field: "emissions", type: "quantitative", title: "排放（GtCO₂）" },
          color: {
            field: "sector", type: "nominal", title: "行业",
            scale: { domain: sectorDomain, range: sectorRange }
          },
          tooltip: [{ field: "company", title: "企业" }, { field: "country", title: "所属国家" }, { field: "emissions", title: "排放" }]
        }
      },
      {
        data: { values: [{ baseline: globalAvg }] },
        mark: { type: "rule", color: "#e41a1c", strokeDash: [4, 4], size: 2 },
        encoding: {
          x: { field: "baseline", type: "quantitative" },
          tooltip: { field: "baseline", type: "quantitative", title: "全球平均水平 (GtCO₂)", format: ".2f" }
        }
      },
      {
        data: { values: [{ baseline: globalAvg }] },
        mark: { type: "text", color: "#e41a1c", align: "right", dx: -8, dy: -14, fontSize: 11, fontWeight: "bold" },
        encoding: {
          x: { field: "baseline", type: "quantitative" },
          y: { value: 0 },
          text: { value: "全球上榜巨头平均水平" }
        }
      }
    ],
    config: { view: { stroke: null } }
  };

  const result = await vegaEmbed("#vis-majors-bar", spec, { actions: false });
  vegaViewBar = result.view;
}

function syncBarSelection(country) {
  if (!vegaViewBar) return;
  try {
    vegaViewBar.signal("selected_country", country || null).runAsync();
  } catch (e) {
    console.error("[carbon-majors] syncBarSelection failed:", e);
  }
}

function setupToggle() {
  const buttons = document.querySelectorAll(".chart-toggle-btn");
  if (buttons.length === 0) {
    console.warn("[carbon-majors] no toggle buttons found in DOM");
    return;
  }

  const containers = {
    map: document.getElementById("vis-majors-map"),
    bar: document.getElementById("vis-majors-bar")
  };

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.view;
      if (!target) return;

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      Object.entries(containers).forEach(([name, el]) => {
        if (!el) return;
        el.classList.toggle("active", name === target);
      });
    });
  });
}

function extractCountry(signalValue) {
  // 清空选择（点击空白处 / null / undefined / {}）
  if (!signalValue) return null;

  // 情况1: { country: "中国" } — 纯字符串，直接返回
  if (typeof signalValue.country === "string") return signalValue.country;

  // 情况2: { country: ["中国"] } — VL point select 最常见格式，取首个元素
  if (Array.isArray(signalValue.country) && signalValue.country.length > 0) {
    return signalValue.country[0];
  }

  // 情况3: { country: [] } — 选择被清空但外壳仍在
  if (Array.isArray(signalValue.country) && signalValue.country.length === 0) return null;

  // 情况4: signalValue 本身是数组 [{ country: "中国" }] 或 ["中国"]
  if (Array.isArray(signalValue) && signalValue.length > 0) {
    const first = signalValue[0];
    if (typeof first === "string") return first;
    if (first && typeof first.country === "string") return first.country;
    if (first && Array.isArray(first.country) && first.country.length > 0) return first.country[0];
  }

  return null;
}

function syncAll(country) {
  updateText(country);
  updateInsight(country);
}

function updateText(country) {
  const el = document.querySelector("#text-majors");
  if (!el) return;

  const hl = (s) => `<strong style="color:#d95f02; font-size: 1.1em;">${s}</strong>`;

  // 全球默认状态 — 强调寡头效应
  if (!country || country === "World") {
    const allSorted = [...majorsData].sort((a, b) => (Number(b.emissions) || 0) - (Number(a.emissions) || 0));
    const top5 = allSorted.slice(0, 5);
    const top5Total = top5.reduce((s, r) => s + (Number(r.emissions) || 0), 0);
    const allTotal = majorsData.reduce((s, r) => s + (Number(r.emissions) || 0), 0);
    const top5Pct = allTotal > 0 ? (top5Total / allTotal * 100).toFixed(1) : "0.0";
    const totalCompanies = majorsData.length;

    el.innerHTML = [
      `<p>在 Carbon Majors 追踪的全球 ${hl(totalCompanies)} 家超级巨头中，仅排名前五的企业，就占据了整个巨头样本总排量的高达 ${hl(top5Pct + "%")}。</p>`,
      `<p>这揭示了全球气候危机的极端寡头效应——极少数的能源巨头掌握着惊人的碳排放开关，合计排放约 ${hl(formatGt(top5Total))}。</p>`,
    ].join("\n");
    return;
  }

  const countryData = majorsData.filter((r) => r.country === country);
  const totalCount = countryData.length;

  // 该国无数据 — 气候正义叙事
  if (totalCount === 0) {
    el.innerHTML = [
      `<p>您选中了 <strong>${country}</strong>。在碳排放大户的追踪中，"没有数据"本身就是一个极其重要的事实。</p>`,
      `<p>Carbon Majors 数据库追踪的是全球历史总排量最大的化石能源生产者。该国的大片空白深刻揭示了气候正义的残酷一面：世界上绝大多数国家并没有产生超级化石能源巨头，但他们却在共同承担气候变化带来的后果。</p>`,
    ].join("\n");
    return;
  }

  const sorted = [...countryData].sort((a, b) => (Number(b.emissions) || 0) - (Number(a.emissions) || 0));
  const top = sorted[0];
  const topEmissions = Number(top.emissions) || 0;
  const topCompany = top.company || "—";
  const topSector = top.sector || "—";

  // 该国仅有 1 家巨头 — 不出现占比
  if (totalCount === 1) {
    el.innerHTML = [
      `<p>您选中了 <strong>${country}</strong>。该国上榜的超级巨头仅有 1 家，即 ${hl(topCompany)}（【${topSector}】）。</p>`,
      `<p>作为该国在 Carbon Majors 数据库中的唯一责任主体，其记录排量达 ${hl(formatGt(topEmissions))}。</p>`,
    ].join("\n");
    return;
  }

  // 该国 >1 家巨头 — 国内集中度叙事
  const countryTotal = countryData.reduce((s, r) => s + (Number(r.emissions) || 0), 0);
  const topPct = countryTotal > 0 ? (topEmissions / countryTotal * 100).toFixed(1) : "0.0";

  // 主导行业：该国排放总和最高的行业
  const sectorEmissions = {};
  for (const r of countryData) {
    const sec = r.sector || "其他";
    sectorEmissions[sec] = (sectorEmissions[sec] || 0) + (Number(r.emissions) || 0);
  }
  let dominantSector = topSector;
  let maxTotal = 0;
  for (const [sec, total] of Object.entries(sectorEmissions)) {
    if (total > maxTotal) { maxTotal = total; dominantSector = sec; }
  }

  el.innerHTML = [
    `<p>您选中了 <strong>${country}</strong>。该国共有 ${hl(totalCount)} 家巨头企业上榜。</p>`,
    `<p>洞察分析显示，该国上榜企业的碳排放高度集中在【${dominantSector}】领域。仅 ${hl(topCompany)} 一家，就占据了该国所有上榜巨头总排量的 ${hl(topPct + "%")}，达 ${hl(formatGt(topEmissions))}。</p>`,
  ].join("\n");
}

function updateInsight(country) {
  // 全球默认状态 — 寡头效应金句
  if (!country || country === "World") {
    const allSorted = [...majorsData].sort((a, b) => (Number(b.emissions) || 0) - (Number(a.emissions) || 0));
    const top5 = allSorted.slice(0, 5);
    const top5Total = top5.reduce((s, r) => s + (Number(r.emissions) || 0), 0);
    const allTotal = majorsData.reduce((s, r) => s + (Number(r.emissions) || 0), 0);
    const top5Pct = allTotal > 0 ? (top5Total / allTotal * 100).toFixed(1) : "0.0";

    setInsight(
      "#insight-majors",
      `全球碳排呈现极端寡头效应：Top 5 巨头占据总样本排量的 <strong>${top5Pct}%</strong>。`
    );
    return;
  }

  const countryData = majorsData.filter((r) => r.country === country);
  const totalCount = countryData.length;

  // 该国无数据 — 核心金句
  if (totalCount === 0) {
    setInsight(
      "#insight-majors",
      `<strong>${country}</strong> 未产生超级化石能源巨头，但共担气候后果。`
    );
    return;
  }

  const sorted = [...countryData].sort((a, b) => (Number(b.emissions) || 0) - (Number(a.emissions) || 0));
  const top = sorted[0];
  const topEmissions = Number(top.emissions) || 0;
  const topCompany = top.company || "—";
  const topSector = top.sector || "—";

  // 该国仅有 1 家巨头 — 无占比
  if (totalCount === 1) {
    setInsight(
      "#insight-majors",
      `<strong>${country}</strong> 的唯一上榜巨头：<strong>${topCompany}</strong>（${topSector}）。`
    );
    return;
  }

  // 该国 >1 家巨头 — 集中度金句
  const countryTotal = countryData.reduce((s, r) => s + (Number(r.emissions) || 0), 0);
  const topPct = countryTotal > 0 ? (topEmissions / countryTotal * 100).toFixed(1) : "0.0";

  setInsight(
    "#insight-majors",
    `<strong>${country}</strong> 的碳责任高度集中于 <strong>${topCompany}</strong>（占该国样本的 <strong>${topPct}%</strong>）。`
  );
}
