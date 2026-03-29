export default async function handler(req, res) {
  const symbol = req.query.symbol;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol required" });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const data = await response.json();

    const result = data?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const price = result.meta.regularMarketPrice || 0;
    const prevClose = result.meta.previousClose || 0;

    const change = ((price - prevClose) / prevClose) * 100;

    let decision = "WATCH";
    let reason = "";
    
    // Strong momentum up
    if (change > 2) {
      decision = "BUY";
      reason = "Strong upward momentum 🚀";
    }
    
    // Mild uptrend
    else if (change > 0.5) {
      decision = "WATCH";
      reason = "Positive trend, wait for dip";
    }
    
    // Small dip (opportunity)
    else if (change > -2) {
      decision = "BUY";
      reason = "Possible accumulation zone 📉";
    }
    
    // Heavy fall (risky)
    else {
      decision = "AVOID";
      reason = "Heavy selling pressure ⚠️";
    }

      res.status(200).json({
      symbol,
      price,
      change: change.toFixed(2),
      decision,
      reason
    });
  } catch (err) {
    res.status(500).json({
      error: "Fetch failed",
      details: err.message
    });
  }
}
