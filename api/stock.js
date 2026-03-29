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
    if (change > 1) decision = "BUY";
    else if (change < -1) decision = "AVOID";

    res.status(200).json({
      symbol,
      price,
      change: change.toFixed(2),
      decision
    });

  } catch (err) {
    res.status(500).json({
      error: "Fetch failed",
      details: err.message
    });
  }
}
