# 碳责任的四个视角

这是一个用于“大数据可视化与可视分析”课程设计的交互式数据文档骨架。

## 运行方式

推荐使用本地静态服务器运行，因为页面需要加载 CSV 数据文件。

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 项目结构

- `index.html`: 主页面与四个叙事板块。
- `css/`: 页面样式。
- `js/modules/`: 四个独立交互模块。
- `data/processed/`: 页面实际读取的数据。
- `docs/`: 课程说明文档草稿。

## 分工建议

- GDP 与排放：`js/modules/gdp-emissions.js`
- 政策与拐点：`js/modules/policy-timeline.js`
- 贸易与责任：`js/modules/trade-carbon.js`
- 企业与占比：`js/modules/carbon-majors.js`
