# 数据字典

## 通用字段

- `country`: 英文国家名。
- `iso3`: ISO 3166-1 alpha-3 国家代码。
- `year`: 年份。

## gdp_emissions.csv

- `gdp_ppp`: PPP 口径 GDP，示例单位为十亿美元。
- `population`: 人口，示例单位为百万人。
- `total_co2`: 总碳排放，示例单位为 GtCO2。
- `co2_per_capita`: 人均碳排放。
- `carbon_intensity`: 碳强度。
- `decoupling_status`: 脱钩状态标签。

## policy_events.csv

- `policy_id`: 政策节点 ID。
- `policy_name`: 政策名称。
- `policy_type`: 政策类型。
- `description`: 政策说明。
- `emissions_before`: 政策节点前三年全球 CO2 排放均值，单位为 GtCO2。
- `emissions_after`: 政策节点后三年全球 CO2 排放均值，单位为 GtCO2。
- `global_emissions`: 全球年度 CO2 排放，单位为 GtCO2。
- `source_url`: 排放或政策节点来源链接。

## trade_carbon.csv

- `production_co2`: 生产端排放。
- `consumption_co2`: 消费端排放。
- `net_embodied_carbon`: 净进口碳，正值表示消费责任高于生产责任。
- `imported_carbon`: 进口隐含碳。
- `exported_carbon`: 出口隐含碳。

## carbon_majors.csv

- `company`: 企业名称。
- `sector`: 行业。
- `emissions`: 企业排放。
- `share`: 企业排放份额。
- `rank`: 排名。
