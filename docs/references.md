# References

## Carbon Majors Module

### Data Sources
- Carbon Majors Database (CDP)
- Climate Accountability Institute

### Key References
- Heede, R. (2014). Tracing anthropogenic carbon dioxide and methane emissions to fossil fuel and cement producers, 1854-2010. *Climatic Change*, 122(1-2), 229-241.
- CDP Carbon Majors Report (2017, 2020, 2024)

### Methodology Notes
- 排放数据按企业报告的直接运营排放和产品使用排放归因
- Top 5 排名基于选定国家和年度的总排放量降序排列
- 份额为企业排放占该国当年总排放的百分比

## Trade Carbon Responsibility Module

### Data Sources
- Our World in Data / Global Carbon Budget, Annual CO2 emissions.
- Our World in Data / Global Carbon Budget, Consumption-based CO2 emissions.
- Our World in Data, Population.
- Vega Datasets, world-110m TopoJSON.

### Methodology Notes
- `trade_carbon.csv` 覆盖 2000-2023 年 50 个主要国家和经济体。
- 领土排放和消费端排放统一换算为 GtCO2。
- 人均口径统一为 tCO2/person，用于地图着色；总量口径保留在 tooltip 与排名说明中。
- 净进口碳计算为 `consumption_co2 - production_co2`，正值表示碳责任转嫁者，负值表示碳责任承担者。
- 责任转移视角的颜色区间固定为 -3 到 +5 tCO2/person，并启用截断显示，避免少数极端国家压缩大多数国家的颜色差异。
