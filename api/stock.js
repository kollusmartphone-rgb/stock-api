export default async function handler(req, res) {
  const symbol = req.query.symbol;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol required" });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

    const response = await fetch(url);
    const data = await response.json();

    const stock = data.quoteResponse.result?.[0];

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const price = stock.regularMarketPrice || 0;
    const pe = stock.trailingPE || 0;

    let score = 0;
    if (pe > 0 && pe < 25) score++;

    const decision =
      score >= 1 ? "BUY" : "WATCH";

    res.status(200).json({
      symbol,
      price,
      pe,
      decision
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
