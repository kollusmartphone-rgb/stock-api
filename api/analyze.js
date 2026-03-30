console.log("API HIT START");
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

    console.log("BEFORE SCREENER CALL");
    // ===== SCREENER FETCH (IMPROVED) =====

        try {
      const cleanSymbol = symbol.replace(".NS", "");
    
      const scrRes = await fetch(
        `https://www.screener.in/company/${cleanSymbol}/consolidated/`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html",
            "Referer": "https://www.google.com/"
          }
        }
      );
    
      const html = await scrRes.text();
    
        const extract = (label) => {
        const regex = new RegExp(
          `${label}[\\s\\S]*?<span[^>]*>([0-9.,-]+)<`,
          "i"
        );
          
        const match = html.match(regex);
    
        return match
          ? parseFloat(match[1].replace(/,/g, ""))
          : null;
      };
    
      pe = extract("Stock P/E");
      roe = extract("ROE");
      debt = extract("Debt to equity");
    
    } catch (err) {
      console.log("Screener failed");
    }


    
    // ===== 3. RULE ENGINE =====
     let score = 0;
    let reasons = [];
    let confidence = 0;
    
    // ===== FUNDAMENTALS =====
    
    // PE
    if (pe !== null) {
      confidence++;
      if (pe > 0 && pe < 25) {
        score++;
        reasons.push("Good PE");
      } else {
        reasons.push("High PE");
      }
    }
    
    // ROE
    if (roe !== null) {
      confidence++;
      if (roe > 15) {
        score++;
        reasons.push("Strong ROE");
      } else {
        reasons.push("Weak ROE");
      }
    }
    
    // Debt
    if (debt !== null) {
      confidence++;
      if (debt < 0.5) {
        score++;
        reasons.push("Low Debt");
      } else {
        reasons.push("High Debt");
      }
    }
    
    // ===== VOLUME =====
    if (volume > 1000000) {
      score++;
      reasons.push("High Volume");
    }
    
    // ===== MOMENTUM =====
    if (change > 1) {
      score++;
      reasons.push("Positive Momentum");
    }
    
    if (change < -3) {
      reasons.push("Heavy Selling");
    }
    
    // ===== FINAL DECISION =====
    let decision = "HOLD";
    
    if (confidence < 2) {
      decision = "LIMITED DATA";
    } else if (score >= 5) {
      decision = "BUY";
    } else if (score <= 2) {
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
