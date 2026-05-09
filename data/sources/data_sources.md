# 数据来源

当前仓库中的部分 `data/processed/` 文件仍为演示用小样本数据，用于验证页面结构和交互方式。第二板块 `policy_events.csv` 已整理为 1990-2024 年全球 CO2 排放序列，并标注 19 个关键国际气候政策节点。

正式提交前建议替换为以下来源的清洗结果：

- Our World in Data: CO2 and Greenhouse Gas Emissions
- Climate Policy Database
- OECD TiVA Database
- Carbon Majors Database

## 第二板块：政策与排放拐点

- 全球年度 CO2 排放：Our World in Data, Annual CO2 emissions, 数据来源为 Global Carbon Budget 2025 with major processing by Our World in Data.
- 京都议定书节点：UNFCCC, The Kyoto Protocol.
- 巴黎协定节点：UNFCCC, The Paris Agreement.
- Doha Amendment 节点：UNFCCC, The Kyoto Protocol / Status of the Doha Amendment.
- 其他 COP 节点：UNFCCC 官方会议成果页面，包括 UNFCCC 框架公约、柏林授权、马拉喀什协定、巴厘路线图、坎昆协议、德班平台、利马会议、卡托维兹气候一揽子方案、格拉斯哥气候公约、损失与损害基金、首次全球盘点和 COP29 新气候资金目标。

`policy_events.csv` 中的 `global_emissions` 统一换算为 GtCO2，`emissions_before` 和 `emissions_after` 为政策年份前后三年的简单均值，便于图表展示政策节点附近趋势。

## 第三板块：贸易与碳责任

- 领土排放：Our World in Data / Global Carbon Budget, Annual CO2 emissions.
  - 下载文件：`data/raw/owid_production_co2.csv`
  - 原始链接：https://ourworldindata.org/grapher/annual-co2-emissions-per-country
- 消费端排放：Our World in Data / Global Carbon Budget, Annual consumption-based CO2 emissions.
  - 下载文件：`data/raw/owid_consumption_co2.csv`
  - 原始链接：https://ourworldindata.org/grapher/consumption-co2-emissions
- 人口：Our World in Data, Population.
  - 下载文件：`data/raw/owid_population.csv`
  - 原始链接：https://ourworldindata.org/grapher/population
- 世界地图底图：Vega Datasets `world-110m.json`，由 Vega-Lite 在页面中远程读取。
  - 原始链接：https://cdn.jsdelivr.net/npm/vega-datasets@2/data/world-110m.json

清洗口径：

- 输出文件：`data/processed/trade_carbon.csv`
- 时间范围：2000-2023 年。
- 国家范围：50 个主要国家和经济体，覆盖 G20、主要 OECD 国家、主要制造业国家、资源出口国和新兴经济体。
- 单位转换：OWID 原始值为吨 CO2，处理后统一转换为 GtCO2。
- 计算方式：`net_embodied_carbon = consumption_co2 - production_co2`。
- 人均计算：总量吨 CO2 除以人口，得到 tCO2/person。
- 责任类型：人均净进口碳绝对值小于 0.2 tCO2/person 记为 `balanced`，正值记为 `net_importer`，负值记为 `net_exporter`。

限制说明：

- 消费端排放数据不是所有国家都有完整覆盖，缺少消费端口径的国家未纳入本模块。
- 消费端排放不包含土地利用变化，也不把国际航空和航运排放分配到单个国家。
- 2024 年数据可能仍会修订，本模块固定使用到 2023 年。

请记录每个数据文件的下载日期、链接、许可说明和清洗方法。
