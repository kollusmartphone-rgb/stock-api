export default async function handler(req, res) {
  const symbol = req.query.symbol;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol required" });
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=demo`;

    const response = await fetch(url);
    const data = await response.json();

    const stock = data[0];

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const price = stock.price || 0;
    const change = stock.changesPercentage || 0;

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
