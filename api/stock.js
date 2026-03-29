export default async function handler(req, res) {
  const symbol = req.query.symbol;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol required" });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    const data = await response.json();

    const stock = data?.quoteResponse?.result?.[0];

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const price = stock.regularMarketPrice || 0;
    const change = stock.regularMarketChangePercent || 0;

    let decision = "WATCH";

    if (change > 1) decision = "BUY";
    else if (change < -1) decision = "AVOID";

    res.status(200).json({
      symbol,
      price,
      change,
      decision
    });

  } catch (err) {
    res.status(500).json({
      error: "Fetch failed",
      details: err.message
    });
  }
}
