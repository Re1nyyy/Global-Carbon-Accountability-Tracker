export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "暂无数据";
  }

  return Number(value).toLocaleString("zh-CN", {
    maximumFractionDigits: digits
  });
}

export function formatGt(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "暂无数据";
  }

  return `${formatNumber(value, 2)} GtCO2`;
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "暂无数据";
  }

  return `${formatNumber(value, 1)}%`;
}
