export default async function handler(req, res) {
  const symbol = req.query.symbol;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol required" });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,financialData,defaultKeyStatistics`;

    const response = await fetch(url);
    const data = await response.json();

    const stock = data.quoteSummary.result?.[0];

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const pe = stock.defaultKeyStatistics?.trailingPE?.raw || 0;
    const debt = stock.financialData?.debtToEquity?.raw || 0;
    const roe = stock.financialData?.returnOnEquity?.raw || 0;
    const profit = stock.financialData?.profitMargins?.raw || 0;
    const price = stock.price?.regularMarketPrice?.raw || 0;

    let score = 0;
    if (profit > 0) score++;
    if (pe > 0 && pe < 25) score++;
    if (debt < 0.5) score++;
    if (roe > 0.15) score++;

    const decision =
      score >= 3 ? "BUY" :
      score === 2 ? "WATCH" :
      "AVOID";

    res.status(200).json({
      symbol,
      price,
      decision,
      score
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
