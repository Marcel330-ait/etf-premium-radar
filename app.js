(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = { lang: "zh", code: "513500", quote: null, budget: 4000, seq: 0 };
  const examples = {
    zh: ["标普 500 ETF", "纳指 100 ETF", "贵州茅台", "宁德时代"],
    en: ["S&P 500 ETF", "Nasdaq 100 ETF", "Kweichow Moutai", "CATL"]
  };
  const text = {
    zh: { brand:"溢价雷达",navMarket:"行情",navView:"白话判断",navPlan:"买入计划",eyebrow:"股票 / ETF 买前检查器",hero1:"输入代码，看懂它",hero2:"现在贵不贵。",intro:"不用懂 PE、IOPV 或复杂公式。输入沪深 6 位代码和预算，我们把数据翻译成白话。",support:"支持沪深 A 股与场内 ETF；暂不支持美股代码。",quick:"试试这些",marketPrice:"当前价格",dayChange:"今日涨跌",verdict:"一句话判断",position:"近一年价格位置",budget:"我的预算",risk:"综合风险温度",tradePrice:"交易价格",priceTemp:"价位温度",low:"相对低位",middle:"中间区域",high:"相对高位",positionHelp:"把最近约 250 个交易日的最低价记为 0，最高价记为 100。它只告诉你位置，不代表真实价值。",forecastKicker:"03 · 时间序列基线",forecastTitle:"未来5个交易日：趋势参考，不是价格预言",modelName:"对数线性趋势 + 波动区间",forecastCurrent:"当前价格",forecastMid:"第5日趋势中值",forecastRange:"约80%波动参考区间",backtestError:"历史5日预测平均误差",beginner:"新手先看这三件事",why:"为什么这么判断",check1:"它是什么",check1p:"ETF 是一篮子资产；股票是一家公司，风险更集中。",check2:"价格有没有额外加价",check2p:"只有 ETF 才有相对净值的溢价，股票没有这个概念。",check3:"一次买多少",check3p:"不要因为一个分数一次买满，分批能降低押错时点的压力。",myPlan:"我的买入计划",planTitle:"预算你来定，节奏提前想好",planIntro:"下面只是纪律模板，不是预测。沪深 ETF 和股票通常按 100 份一手。",budgetInput:"输入投资预算",perLot:"每手约",maxBuy:"一次性全部买入最多",cashLeft:"一次性买入后剩余",fees:"未计佣金",planClarifier:"上面是假设现在一次性投入全部预算；下面才是分三批、满足价格条件后再执行的计划。",plannedTotal:"三批全部触发时预计投入",disclaimer:"仅为信息与计算工具，不构成投资建议。公开行情可能延迟或有误，下单前请以交易所、基金公司及券商数据为准。"},
    en: { brand:"Premium Radar",navMarket:"Market",navView:"Plain view",navPlan:"Buy plan",eyebrow:"Stock / ETF pre-buy check",hero1:"Enter a code. See if",hero2:"the price looks high.",intro:"No PE or IOPV expertise needed. Enter a 6-digit Shanghai/Shenzhen code and a budget; we translate the data into plain language.",support:"Supports mainland A-shares and exchange-traded ETFs; US tickers are not yet supported.",quick:"Quick examples",marketPrice:"Market price",dayChange:"Today",verdict:"Plain-language verdict",position:"1-year price position",budget:"My budget",risk:"Risk temperature",tradePrice:"Trading price",priceTemp:"Price temperature",low:"Lower range",middle:"Middle range",high:"Upper range",positionHelp:"The lowest close in roughly 250 trading days is 0 and the highest is 100. This shows position, not intrinsic value.",forecastKicker:"03 · Time-series baseline",forecastTitle:"Next 5 sessions: a trend reference, not a price prophecy",modelName:"Log-linear trend + volatility interval",forecastCurrent:"Current price",forecastMid:"Day-5 trend midpoint",forecastRange:"Approx. 80% volatility range",backtestError:"Historical 5-day mean error",beginner:"Three beginner checks",why:"Why this result",check1:"Know what you own",check1p:"An ETF holds a basket; a stock is one company and is more concentrated.",check2:"Check extra markup",check2p:"Only ETFs can trade at a premium to NAV. Stocks do not have this concept.",check3:"Size the first buy",check3p:"Do not fill the whole position because of one score. Staging reduces timing pressure.",myPlan:"My buy plan",planTitle:"You set the budget; plan the pace",planIntro:"This is a discipline template, not a forecast. Mainland ETFs and stocks usually trade in lots of 100.",budgetInput:"Investment budget",perLot:"Approx. per lot",maxBuy:"Maximum if invested all at once",cashLeft:"Cash left after an all-in buy",fees:"Fees excluded",planClarifier:"The summary above assumes the full budget is invested now. The rows below are a separate three-stage plan, executed only if each price condition is met.",plannedTotal:"Estimated cost if all three stages trigger",disclaimer:"Information and calculation only—not investment advice. Public quotes may be delayed or wrong. Confirm with the exchange, fund manager and broker before trading."}
  };

  function jsonp(url, callbackParam, timeout) {
    return new Promise((resolve, reject) => {
      const name = "__radar_jsonp_" + Date.now() + "_" + (++state.seq);
      const script = document.createElement("script");
      const timer = setTimeout(() => finish(new Error("timeout")), timeout || 12000);
      function finish(error, value) { clearTimeout(timer); delete window[name]; script.remove(); error ? reject(error) : resolve(value); }
      window[name] = (value) => finish(null, value);
      script.onerror = () => finish(new Error("network"));
      script.src = url + (url.includes("?") ? "&" : "?") + encodeURIComponent(callbackParam || "cb") + "=" + encodeURIComponent(name);
      document.head.appendChild(script);
    });
  }

  function fundNav(code) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      const previous = window.jsonpgz;
      const timer = setTimeout(() => done(null), 8000);
      function done(value) { clearTimeout(timer); script.remove(); if (previous) window.jsonpgz = previous; else delete window.jsonpgz; resolve(value); }
      window.jsonpgz = done;
      script.onerror = () => done(null);
      script.src = "https://fundgz.1234567.com.cn/js/" + code + ".js?_=" + Date.now();
      document.head.appendChild(script);
    });
  }

  function marketId(code) { return code.startsWith("5") || code.startsWith("6") ? "1" : "0"; }
  function isEtf(code) { return code.startsWith("5") || code.startsWith("1"); }
  function priceDivisor(code) { return isEtf(code) ? 1000 : 100; }
  function fmt(v, d) { return v == null || !Number.isFinite(v) ? "—" : Number(v).toFixed(d == null ? 2 : d); }
  function pct(v) { return v == null || !Number.isFinite(v) ? "—" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%"; }
  function money(v) { return "¥" + Math.round(v || 0).toLocaleString("zh-CN"); }

  async function query(code) {
    if (!/^\d{6}$/.test(code)) throw new Error(state.lang === "zh" ? "请输入正确的 6 位沪深代码。" : "Enter a valid 6-digit code.");
    const secid = marketId(code) + "." + code;
    const fields = "f43,f44,f45,f57,f58,f60,f162,f167,f170";
    const quoteUrl = "https://push2.eastmoney.com/api/qt/stock/get?secid=" + secid + "&fields=" + fields;
    const historyUrl = "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=" + secid + "&klt=101&fqt=1&lmt=250&end=20500101&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56";
    const tasks = [jsonp(quoteUrl, "cb"), jsonp(historyUrl, "cb"), isEtf(code) ? fundNav(code) : Promise.resolve(null)];
    const [quoteJson, historyJson, nav] = await Promise.all(tasks);
    const q = quoteJson && quoteJson.data;
    if (!q || !q.f58 || q.f43 === "-") throw new Error(state.lang === "zh" ? "查不到这个代码，请确认后重试。" : "This code was not found.");
    const divisor = priceDivisor(code);
    const price = Number(q.f43) / divisor;
    const closes = ((historyJson && historyJson.data && historyJson.data.klines) || []).map(row => Number(row.split(",")[2])).filter(Number.isFinite);
    const low = closes.length ? Math.min.apply(null, closes) : null;
    const high = closes.length ? Math.max.apply(null, closes) : null;
    const position = low != null && high > low ? Math.max(0, Math.min(100, (price - low) / (high - low) * 100)) : null;
    const estimatedNav = nav && Number(nav.gsz) > 0 ? Number(nav.gsz) : null;
    return { code, name:String(q.f58), type:isEtf(code) ? "etf" : "stock", price, change:Number(q.f170 || 0) / 100, pe:Number(q.f162) > 0 ? Number(q.f162) / 100 : null, nav:estimatedNav, premium:estimatedNav ? (price / estimatedNav - 1) * 100 : null, position, low, high, closes, time:(nav && nav.gztime) || new Date().toLocaleString("zh-CN", {hour12:false}) };
  }

  function regressionSlope(values) {
    const n=values.length; if(n<2)return 0; const meanX=(n-1)/2; const meanY=values.reduce((a,b)=>a+b,0)/n;
    let top=0,bottom=0; for(let i=0;i<n;i++){top+=(i-meanX)*(values[i]-meanY);bottom+=(i-meanX)*(i-meanX);} return bottom?top/bottom:0;
  }

  function forecast(q) {
    const prices=(q.closes||[]).filter(v=>v>0); if(prices.length<35)return null;
    const window=prices.slice(-60); const logs=window.map(Math.log); const slope=regressionSlope(logs);
    const returns=[]; for(let i=1;i<window.length;i++)returns.push(Math.log(window[i]/window[i-1]));
    const mean=returns.reduce((a,b)=>a+b,0)/returns.length; const variance=returns.reduce((a,b)=>a+(b-mean)*(b-mean),0)/Math.max(1,returns.length-1); const sigma=Math.sqrt(variance);
    const current=q.price; const days=[]; for(let h=1;h<=5;h++){const mid=current*Math.exp(slope*h); const band=1.2816*sigma*Math.sqrt(h); days.push({h,mid,low:mid*Math.exp(-band),high:mid*Math.exp(band)});}
    const errors=[]; const start=Math.max(35,prices.length-45); for(let end=start;end+5<prices.length;end++){const training=prices.slice(Math.max(0,end-30),end+1); const s=regressionSlope(training.map(Math.log)); const predicted=prices[end]*Math.exp(s*5); errors.push(Math.abs(predicted-prices[end+5])/prices[end+5]*100);}
    const mape=errors.length?errors.reduce((a,b)=>a+b,0)/errors.length:null; return {days,mape,slope,sigma};
  }

  function analysis(q) {
    const zh = state.lang === "zh", pos = q.position == null ? 50 : q.position;
    let level="careful", title, copy;
    if (q.type === "etf") {
      if (q.premium == null) { title=zh?"净值估算暂缺，先看价位":"NAV estimate unavailable—use price position"; copy=zh?"当前只能判断近一年价格位置，不能可靠计算溢价。":"Only the 1-year price position is available; premium cannot be calculated reliably."; }
      else if (q.premium > 3) { level="danger"; title=zh?"额外加价太高，先别追":"Premium too high—do not chase"; copy=zh?`当前溢价约 ${fmt(q.premium)}%，即使指数不跌，溢价回落也会造成损失。`:`The ETF trades about ${fmt(q.premium)}% above estimated NAV. That gap can close even if the index stays flat.`; }
      else if (q.premium > 1.5 || pos > 80) { title=zh?"不算便宜，适合分批等":"Not cheap—stage the purchase"; copy=zh?"溢价或近一年价位偏高，先买小部分比一次买满更稳。":"The premium or 1-year position is elevated. A small first tranche is safer."; }
      else { level="good"; title=zh?"没有明显加价，可按计划分批":"No major markup—staging is reasonable"; copy=zh?"交易价格相对净值较正常，但市场仍会波动，不建议一次买满。":"Price is reasonably close to NAV, but market risk remains."; }
    } else {
      if (!q.pe) { level="danger"; title=zh?"盈利信息不足，新手先别只看价格":"Profit data is weak—price alone is not enough"; copy=zh?"公司可能亏损或盈利数据暂缺，需要先了解业务和财报。":"The company may be loss-making or profit data may be unavailable."; }
      else if (q.pe > 50 || pos > 90) { level="danger"; title=zh?"期待很高，追高风险较大":"Expectations are high—chasing is risky"; copy=zh?`近一年价位约 ${Math.round(pos)}/100，盈利估值约 ${fmt(q.pe,1)} 倍，容错较小。`:`Price position is ${Math.round(pos)}/100 and PE is about ${fmt(q.pe,1)}×.`; }
      else if (q.pe > 30 || pos > 75) { title=zh?"价格不低，只适合小额分批":"Price is not low—use small tranches"; copy=zh?"市场已经计入不少好消息，先用小仓位验证判断。":"The market already prices in meaningful optimism."; }
      else { level="good"; title=zh?"数据不算过热，但仍要看公司本身":"Data is not overheated, but company quality matters"; copy=zh?"价格和盈利倍数没有亮红灯，不等于公司一定值得买。":"No price red flag does not prove the company is a good investment."; }
    }
    const peRisk = q.type === "stock" ? (!q.pe ? 35 : Math.max(0,(q.pe-15)*1.1)) : 0;
    const risk = Math.max(0,Math.min(100,18+pos*.38+Math.max(q.premium||0,0)*8+peRisk));
    return { level,title,copy,risk,pos };
  }

  function render() {
    const q=state.quote; if (!q) return; const a=analysis(q); const zh=state.lang==="zh";
    $("assetType").textContent=q.type==="etf"?"ETF":(zh?"股票":"Stock"); $("assetName").textContent=q.name; $("assetCode").textContent=q.code;
    $("marketPrice").textContent=fmt(q.price,q.type==="etf"?3:2); $("dayChange").textContent=pct(q.change); $("dayChange").className=q.change>=0?"up":"down";
    $("verdictBox").className="verdict "+a.level; $("verdictTitle").textContent=a.title; $("verdictCopy").textContent=a.copy;
    $("premiumPill").innerHTML=q.type==="etf"?(zh?"ETF 溢价 ":"ETF premium ")+"<b>"+pct(q.premium)+"</b>":(zh?"股票没有净值溢价":"Stocks have no NAV premium")+" <b>—</b>";
    $("positionPill").textContent=q.position==null?"—":Math.round(a.pos)+"/100"; $("positionScore").textContent=q.position==null?"—":Math.round(a.pos);
    $("positionFill").style.width=a.pos+"%"; $("positionMarker").style.left=a.pos+"%"; $("riskGauge").style.setProperty("--risk",a.risk+"%"); $("riskNumber").textContent=Math.round(a.risk);
    if(q.type==="etf"){ $("metricTitle").textContent=zh?"ETF 溢价":"ETF premium"; $("metricValue").textContent=pct(q.premium); $("metricLabel").textContent=zh?"你比基金资产估值多付多少":"Extra paid over estimated NAV"; $("metricFormula").textContent=zh?"场内价 ÷ 估值净值 − 1":"Market price ÷ estimated NAV − 1"; $("metricHint").textContent=zh?"ETF 溢价超过 3% 时，即使指数不跌，溢价回落也可能带来损失。":"Above a 3% ETF premium, a return toward NAV can hurt even if the index stays flat."; }
    else { $("metricTitle").textContent=zh?"公司盈利估值":"Profit valuation"; $("metricValue").textContent=q.pe?fmt(q.pe,1)+(zh?"倍":"×"):"—"; $("metricLabel").textContent=zh?"市场为每 1 元年度利润支付多少元":"Price paid for each unit of annual profit"; $("metricFormula").textContent=zh?"PE 越高，通常期待越高、容错越低":"Higher PE often means higher expectations"; $("metricHint").textContent=q.pe?(zh?"PE 只是一个筛查指标，仍需了解公司的业务、负债和盈利质量。":"PE is only a screen; review the business, debt and profit quality."):(zh?"可能亏损或数据暂缺，不能只看股价下结论。":"The company may be loss-making or data may be missing."); }
    $("updateTime").textContent=(zh?"行情更新时间：":"Quote time: ")+q.time; renderForecast(q); renderBudget();
  }

  function renderForecast(q){
    const f=forecast(q), zh=state.lang==="zh", digits=q.type==="etf"?3:2;
    if(!f){$("forecastMid").textContent="—";$("forecastRange").textContent="—";$("backtestError").textContent="—";$("forecastDays").innerHTML="";return;}
    const day5=f.days[4]; $("forecastCurrent").textContent="¥"+fmt(q.price,digits); $("forecastMid").textContent="¥"+fmt(day5.mid,digits); $("forecastRange").textContent="¥"+fmt(day5.low,digits)+" — ¥"+fmt(day5.high,digits); $("backtestError").textContent=f.mape==null?"—":fmt(f.mape,1)+"%";
    $("forecastDays").innerHTML=f.days.map(d=>`<div><small>${zh?"第":"Day "}${d.h}${zh?"日":""}</small><b>¥${fmt(d.mid,digits)}</b></div>`).join("");
    const direction=f.slope>.001?(zh?"短期趋势向上":"Short-term trend slopes up"):f.slope<-.001?(zh?"短期趋势向下":"Short-term trend slopes down"):(zh?"短期趋势接近平缓":"Short-term trend is near flat");
    $("forecastExplain").textContent=direction+"。"+(zh?"模型使用最近60个交易日的对数价格趋势；区间假设近期波动方式继续，平均误差来自过去多个时点的5日预测。消息、财报和市场风格变化会让它迅速失效。":" The model uses a 60-session log-price trend. The range assumes recent volatility continues, and mean error comes from past 5-day forecasts. News, earnings and regime changes can invalidate it quickly.");
  }

  function renderBudget(){ const q=state.quote; if(!q)return; const zh=state.lang==="zh"; const lot=q.price*100; const shares=Math.floor(state.budget/lot)*100; const spent=shares*q.price; $("budgetPill").textContent=money(state.budget); $("lotCost").textContent=money(lot); $("maxShares").textContent=shares.toLocaleString()+ (zh?" 份 / 股":" units / shares"); $("maxSpent").textContent="≈ "+money(spent); $("cashLeft").textContent=money(Math.max(0,state.budget-spent));
    const steps=q.type==="etf"?[{r:.4,m:1.5,zh:"第一笔 · 试仓",en:"First · starter",nzh:"溢价回到 1.5% 内",nen:"Premium at or below 1.5%"},{r:.3,m:.5,zh:"第二笔 · 等确认",en:"Second · confirm",nzh:"溢价回到 0.5% 内",nen:"Premium at or below 0.5%"},{r:.3,m:0,zh:"第三笔 · 留给回撤",en:"Third · save for pullback",nzh:"平价或折价再考虑",nen:"Consider at NAV or discount"}]:[{r:.4,m:0,zh:"第一笔 · 试仓",en:"First · starter",nzh:"先用小仓位验证判断",nen:"Test the idea with a small size"},{r:.3,m:-8,zh:"第二笔 · 等确认",en:"Second · confirm",nzh:"比现价回落约 8%",nen:"About 8% below today"},{r:.3,m:-15,zh:"第三笔 · 留给回撤",en:"Third · save for pullback",nzh:"比现价回落约 15%",nen:"About 15% below today"}];
    const anchor=q.type==="etf"?(q.nav||q.price):q.price; const priceDigits=q.type==="etf"?3:2; const plans=steps.map(s=>{const target=Number((anchor*(1+s.m/100)).toFixed(priceDigits));const part=state.budget*s.r;return{s,target,part,units:Math.floor(part/(target*100))*100};});
    const minimumAll=plans.reduce((sum,p)=>sum+p.target*100,0); if(plans.some(p=>p.units===0)&&state.budget>=minimumAll){plans.forEach(p=>p.units=Math.max(100,p.units));}
    let plannedCost=0; $("trancheList").innerHTML=plans.map((p,i)=>{const cost=p.units*p.target;plannedCost+=cost;const insufficient=p.units===0;const budgetText=insufficient?(zh?`本批不足一手 · 至少需 ${money(p.target*100)}`:`Below one lot · needs ${money(p.target*100)}`):`${money(cost)} · ${p.units} ${zh?"份 / 股":"units"}`;return `<article><span class="step">0${i+1}</span><div><h3>${zh?p.s.zh:p.s.en}</h3><p>${zh?p.s.nzh:p.s.nen}</p></div><div><small>${zh?"触发价格不高于":"Trigger price at or below"}</small><b>¥${fmt(p.target,q.type==="etf"?3:2)}</b></div><div><small>${zh?"触发后计划买入":"Planned buy if triggered"}</small><b>${budgetText}</b></div></article>`;}).join("");
    $("plannedTotal").textContent=money(plannedCost); $("plannedCash").textContent=(zh?"预算剩余约 ":"Budget left about ")+money(Math.max(0,state.budget-plannedCost));
  }

  async function load(code){ $("loadingLine").hidden=false; $("errorLine").textContent=""; $("analyseBtn").disabled=true; try{ const q=await query(code); state.code=code; state.quote=q; $("codeInput").value=code; document.querySelectorAll("[data-code]").forEach(b=>b.classList.toggle("active",b.dataset.code===code)); render(); }catch(e){ $("errorLine").textContent=e.message||(state.lang==="zh"?"行情连接失败，请稍后重试。":"Quote connection failed. Try again later."); }finally{ $("loadingLine").hidden=true; $("analyseBtn").disabled=false; } }
  function applyLanguage(){ const d=text[state.lang]; document.documentElement.lang=state.lang==="zh"?"zh-CN":"en"; document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(d[k])el.textContent=d[k];}); $("brandText").textContent=d.brand; $("langBtn").textContent=state.lang==="zh"?"EN":"中文"; $("analyseBtn").textContent=state.lang==="zh"?"开始分析 →":"Analyse →"; $("refreshBtn").textContent=state.lang==="zh"?"↻ 刷新行情":"↻ Refresh"; $("codeInput").placeholder=state.lang==="zh"?"输入 6 位代码，例如 513500":"6-digit code, e.g. 513500"; document.querySelectorAll("[data-code] i").forEach((el,i)=>el.textContent=examples[state.lang][i]); if(state.quote)render(); }

  $("searchForm").addEventListener("submit",e=>{e.preventDefault();load($("codeInput").value.trim());});
  $("codeInput").addEventListener("input",e=>{e.target.value=e.target.value.replace(/\D/g,"").slice(0,6);});
  document.querySelectorAll("[data-code]").forEach(b=>b.addEventListener("click",()=>load(b.dataset.code)));
  $("budgetInput").addEventListener("input",e=>{state.budget=Math.max(0,Number(e.target.value)||0);renderBudget();});
  $("refreshBtn").addEventListener("click",()=>load(state.code)); $("langBtn").addEventListener("click",()=>{state.lang=state.lang==="zh"?"en":"zh";applyLanguage();});
  applyLanguage(); load("513500");
})();
