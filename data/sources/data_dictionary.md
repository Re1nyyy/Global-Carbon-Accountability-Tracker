# 数据字典

## 通用字段

- `country`: 英文国家名。
- `iso3`: ISO 3166-1 alpha-3 国家代码。
- `iso_num`: ISO 3166-1 numeric 国家代码，用于与 Vega Datasets 的世界地图底图匹配。
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
- `policy_name_zh`: 政策中文显示名称。
- `policy_type`: 政策类型。
- `description`: 政策说明。
- `emissions_before`: 政策节点前三年全球 CO2 排放均值，单位为 GtCO2。
- `emissions_after`: 政策节点后三年全球 CO2 排放均值，单位为 GtCO2。
- `global_emissions`: 全球年度 CO2 排放，单位为 GtCO2。
- `source_url`: 排放或政策节点来源链接。

## trade_carbon.csv

- `region`: 国家或经济体所属地区。
- `population`: 国家或经济体人口，用于计算人均排放。
- `production_co2`: 生产端排放，单位为 GtCO2。该口径统计本国境内发生的 CO2 排放。
- `consumption_co2`: 消费端排放，单位为 GtCO2。该口径将进口商品中的隐含碳计入最终消费国，并扣除出口商品中的隐含碳。
- `net_embodied_carbon`: 净进口碳，单位为 GtCO2，计算方式为 `consumption_co2 - production_co2`。正值表示消费责任高于生产责任，负值表示生产责任高于消费责任。
- `production_co2_per_capita`: 人均生产端排放，单位为 tCO2/person。
- `consumption_co2_per_capita`: 人均消费端排放，单位为 tCO2/person。
- `net_embodied_carbon_per_capita`: 人均净进口碳，单位为 tCO2/person，计算方式为 `consumption_co2_per_capita - production_co2_per_capita`。
- `responsibility_type`: 碳责任转移类型，取值为 `net_importer`、`net_exporter` 或 `balanced`。
- `longitude`: 国家气泡在世界地图上的经度。
- `latitude`: 国家气泡在世界地图上的纬度。

## carbon_majors.csv

- `company`: 企业名称。
- `sector`: 行业。
- `emissions`: 企业排放。
- `share`: 企业排放份额。
- `rank`: 排名。
