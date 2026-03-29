export default async function handler(req, res) {
  const symbol = req.query.symbol.replace(".NS", "");

  try {
    const url = `https://www.screener.in/company/${symbol}/`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await response.text();

    // VERY SIMPLE PARSING (basic but works)
    const getValue = (label) => {
      const regex = new RegExp(label + `.*?<span.*?>(.*?)</span>`, "i");
      const match = html.match(regex);
      return match ? match[1].replace(/,/g, "") : null;
    };

    const pe = parseFloat(getValue("P/E")) || 0;
    const roe = parseFloat(getValue("ROE")) || 0;
    const debt = parseFloat(getValue("Debt to equity")) || 0;

    res.status(200).json({
      pe,
      roe,
      debt
    });

  } catch (err) {
    res.status(500).json({ error: "Failed fundamentals" });
  }
}
