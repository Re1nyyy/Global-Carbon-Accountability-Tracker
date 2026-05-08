# 数据来源

当前仓库中的部分 `data/processed/` 文件仍为演示用小样本数据，用于验证页面结构和交互方式。第二板块 `policy_events.csv` 已整理为 1990-2024 年全球 CO2 排放序列，并标注关键国际气候政策节点。

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
- 其他 COP 节点：UNFCCC 官方会议成果页面。

`policy_events.csv` 中的 `global_emissions` 统一换算为 GtCO2，`emissions_before` 和 `emissions_after` 为政策年份前后三年的简单均值，便于图表展示政策节点附近趋势。

请记录每个数据文件的下载日期、链接、许可说明和清洗方法。
