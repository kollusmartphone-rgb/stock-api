export default async function handler(req, res) {
  const { price, change, pe, roe, debt, volume } = req.query;

  let score = 0;
  let reasons = [];

 // ===== FUNDAMENTALS =====
if (pe > 0) {
  if (pe < 25) {
    score++;
    reasons.push("Good PE");
  } else {
    reasons.push("High PE");
  }
} else {
  reasons.push("PE not available");
}

if (roe > 0) {
  if (roe > 15) {
    score++;
    reasons.push("Strong ROE");
  } else {
    reasons.push("Weak ROE");
  }
} else {
  reasons.push("ROE not available");
}

if (debt > 0) {
  if (debt < 0.5) {
    score++;
    reasons.push("Low Debt");
  } else {
    reasons.push("High Debt");
  }
} else {
  reasons.push("Debt data missing");
}

  // ===== VOLUME =====
  if (volume > 1000000) {
    score++;
    reasons.push("High volume");
  }

  // ===== MOMENTUM =====
  if (change > 1) {
    score++;
    reasons.push("Positive momentum");
  }

  if (change < -3) {
    score--;
    reasons.push("Heavy selling");
  }

  // ===== FINAL =====
  let decision = "HOLD";

  if (score >= 5) decision = "BUY";
  else if (score <= 2) decision = "SELL";

  res.status(200).json({
    score,
    decision,
    reasons
  });
}
