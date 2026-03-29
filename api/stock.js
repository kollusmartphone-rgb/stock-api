export default async function handler(req, res) {
  const symbol = req.query.symbol;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol required" });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = await response.json();

    const result = data?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const price = result.meta?.regularMarketPrice || 0;
    const prevClose = result.meta?.previousClose || 0;

    const change = prevClose
      ? ((price - prevClose) / prevClose) * 100
      : 0;

    const volume = result.meta?.regularMarketVolume || 0;

    return res.status(200).json({
      symbol,
      price,
      change,
      volume
    });

  } catch (err) {
    return res.status(500).json({
      error: "API failed",
      details: err.message
    });
  }
}
