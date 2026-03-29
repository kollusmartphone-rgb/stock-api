export default async function handler(req, res) {
  const { price, change } = req.query;

  let score = 0;
  let reasons = [];

  // Momentum
  if (change > 1) {
    score++;
    reasons.push("Positive momentum");
  }

  if (change < -3) {
    score--;
    reasons.push("Heavy selling pressure");
  }

  // Stability
  if (Math.abs(change) < 2) {
    score++;
    reasons.push("Stable movement");
  }

  // Avoid penny
  if (price > 50) {
    score++;
    reasons.push("Not a penny stock");
  }

  let decision = "HOLD";
  if (score >= 3) decision = "BUY";
  else if (score <= 0) decision = "AVOID";

  res.status(200).json({
    score,
    decision,
    reasons
  });
}
