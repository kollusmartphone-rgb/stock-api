export default async function handler(req, res) {
  const symbol = req.query.symbol;
  const volume = result.meta.regularMarketVolume || 0;
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

    const price = result.meta.regularMarketPrice;
    const prevClose = result.meta.previousClose;
    const change = ((price - prevClose) / prevClose) * 100;

       res.status(200).json({
      symbol,
      price,
      change,
      volume
    });

  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
}
