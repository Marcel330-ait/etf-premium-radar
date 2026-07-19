# 溢价雷达 / Premium Radar

一个无需后端的沪深股票与场内 ETF 买前检查器。输入 6 位代码即可查看公开行情、近一年价格位置、ETF 估值净值溢价或股票 PE 风险，并按自定义预算生成分批买入模板。

## 数据与限制

- 行情与历史价格通过东方财富公开 JSONP 接口读取。
- ETF 估值净值通过天天基金公开 JSONP 接口读取；估值可能延迟或暂停。
- 仅供信息展示和计算，不构成投资建议。
- 支持沪深 A 股及场内 ETF，暂不支持美股代码。

This is a static, bilingual, browser-only tool. No API key or server is required.
