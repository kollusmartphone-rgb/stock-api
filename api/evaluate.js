export default async function handler(req, res) {
  const { price, change, pe, roe, debt, volume } = req.query;

  let score = 0;
  let reasons = [];
  let dataConfidence = 0; // NEW

  // ===== FUNDAMENTALS =====

  if (pe > 0) {
    dataConfidence++;
    if (pe < 25) {
      score++;
      reasons.push("Good PE");
    } else {
      reasons.push("High PE");
    }
  }

  if (roe > 0) {
    dataConfidence++;
    if (roe > 15) {
      score++;
      reasons.push("Strong ROE");
    } else {
      reasons.push("Weak ROE");
    }
  }

  if (debt > 0) {
    dataConfidence++;
    if (debt < 0.5) {
      score++;
      reasons.push("Low Debt");
    } else {
      reasons.push("High Debt");
    }
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
    reasons.push("Heavy selling");
  }

  // ===== DECISION LOGIC (FIXED) =====

  let decision = "HOLD";

  if (dataConfidence === 0) {
    decision = "INSUFFICIENT DATA";
  } else if (score >= 4) {
    decision = "BUY";
  } else if (score <= 1) {
    decision = "SELL";
  }

  res.status(200).json({
    score,
    decision,
    reasons,
    dataConfidence
  });
}
