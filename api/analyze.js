export default async function handler(req, res) {
  const symbol = req.query.symbol;

  try {
    // ===== 1. PRICE + VOLUME (Yahoo) =====
    const yahooRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );

    const yahooData = await yahooRes.json();
    const result = yahooData?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const price = result.meta.regularMarketPrice;
    const prevClose = result.meta.previousClose;
    const change = ((price - prevClose) / prevClose) * 100;
    const volume = result.meta.regularMarketVolume || 0;

    // ===== FUNDAMENTALS FROM FMP (CORRECT ENDPOINT) =====
let pe = null, roe = null, debt = null;

try {
  const cleanSymbol = symbol.replace(".NS", "");

  const fmpRes = await fetch(
    `https://financialmodelingprep.com/api/v3/ratios/${cleanSymbol}?apikey=demo`
  );

  const fmpData = await fmpRes.json();
  const f = fmpData?.[0];

  if (f) {
    pe = f.priceEarningsRatio || null;
    roe = f.returnOnEquity || null;
    debt = f.debtEquityRatio || null;
  }

} catch (err) {
  console.log("FMP failed");
}
    
     // ---- TRY SCREENER (IMPROVED PARSER) ----
try {
  const scrRes = await fetch(
    `https://www.screener.in/company/${symbol.replace(".NS","")}/consolidated/`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );

  const html = await scrRes.text();

  // Extract ratios block
  const ratioSection = html.match(/<ul class="ranges">(.*?)<\/ul>/s);

  if (ratioSection) {
    const section = ratioSection[1];

    const extract = (label) => {
      const regex = new RegExp(label + `.*?<span.*?>(.*?)</span>`, "i");
      const match = section.match(regex);
      return match ? parseFloat(match[1].replace(/,/g, "")) : null;
    };

    pe = extract("P/E");
    roe = extract("ROE");
    debt = extract("Debt to equity");
  }

} catch (err) {
  console.log("Screener parsing failed");
}

    // ===== 3. RULE ENGINE =====
    let score = 0;
    let reasons = [];
    let confidence = 0;

    // Fundamentals
    if (pe !== null) {
      confidence++;
      if (pe < 25) {
        score++;
        reasons.push("Good PE");
      } else {
        reasons.push("High PE");
      }
    }

    // Volume
    if (volume > 1000000) {
      score++;
      reasons.push("High volume");
    }

    // Momentum
    if (change > 1) {
      score++;
      reasons.push("Positive momentum");
    }

    if (change < -3) {
      reasons.push("Heavy selling");
    }

    // ===== DECISION =====
    let decision = "HOLD";

    if (confidence === 0) {
      decision = "LIMITED DATA";
    } else if (score >= 3) {
      decision = "BUY";
    } else if (score <= 1) {
      decision = "SELL";
    }

    res.status(200).json({
      symbol,
      price,
      change: change.toFixed(2),
      volume,
      pe,
      score,
      decision,
      reasons,
      confidence
    });

  } catch (err) {
    res.status(500).json({
      error: "Analyze failed",
      details: err.message
    });
  }
}
