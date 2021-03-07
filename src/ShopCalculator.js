function calculateMetalPrice(weight, metalRate, purity) {
  return Math.floor(weight*metalRate*purity);
}

function calculateMakingRate(makingRate, appliedGradeMakingRateDiff, newGradeMakingRateDiff) {
  return makingRate - appliedGradeMakingRateDiff + newGradeMakingRateDiff;
}

function calculateMakingCharge(weight, makingRate, minimumMaking,
  appliedGradeMakingDiff, newGradeMakingDiff, diffUnit, mmDiffUnit) {
  return Math.floor(Math.max(weight*calculateMakingRate(makingRate, appliedGradeMakingDiff["DIFF"] * diffUnit, newGradeMakingDiff["DIFF"] * diffUnit),
    calculateMakingRate(minimumMaking, appliedGradeMakingDiff["MM_DIFF"] * mmDiffUnit, newGradeMakingDiff["MM_DIFF"] * mmDiffUnit)));
}

function calculatePrice(weight, metalRate, makingRate, minimumMaking, purity,
  appliedGradeMakingDiff, newGradeMakingDiff, diffUnit, mmDiffUnit,
  cgstPercentage, sgstPercentage) {
  let metalPrice = calculateMetalPrice(weight, metalRate, purity);
  let makingCharge = calculateMakingCharge(weight, makingRate, minimumMaking,
    appliedGradeMakingDiff, newGradeMakingDiff, diffUnit, mmDiffUnit);
  let gstApplied = calculateGST(metalPrice + makingCharge, cgstPercentage, sgstPercentage);
  let totalPrice = metalPrice + makingCharge + gstApplied.total;

  return {
    totalPrice,
    metalPrice,
    makingCharge,
    gstApplied
  };
}

function calculateMetalPurchaseRate(metalRate, purchaseRateDiff) {
  return metalRate + purchaseRateDiff;
}

function calculateMetalPurchaseRateDiff(metalRate, purchaseRate) {
  return purchaseRate - metalRate;
}

function calculateCostPrice(weight, costRate, afterWastage) {
  return weight * costRate * afterWastage;
}

function calculateGST(taxedAmount, cgstPercentage, sgstPercentage) {
  let cgst = Math.round(taxedAmount * 0.01 * cgstPercentage * 2) / 2;
  let sgst = Math.round(taxedAmount * 0.01 * sgstPercentage * 2) / 2;
  let total = cgst + sgst;
  return {
    total,
    cgst,
    sgst
  }
}

function calculateGSTAppliedTotals(
  sellingPrice, discount, cgstPercentage, sgstPercentage) {
    let taxedAmount = sellingPrice - discount;
    let cgstApplied = Math.floor(taxedAmount * 0.01 * cgstPercentage);
    let sgstApplied = Math.floor(taxedAmount * 0.01 * sgstPercentage);
    let totalPrice = taxedAmount + cgstApplied + sgstApplied;
    let adjustedDiscount = discount;
    return {
      taxedAmount,
      cgstApplied,
      sgstApplied,
      totalPrice,
      adjustedDiscount
    };
  }

function calculateGSTInplaceTotals(
  sellingPrice, discount, cgstPercentage, sgstPercentage) {
    let finalPrice = sellingPrice - discount;
    let taxedAmount = Math.round(finalPrice / (1 + 0.01 * (cgstPercentage + sgstPercentage)));
    let gstApplied = finalPrice - taxedAmount;
    let cgstApplied = Math.floor(taxedAmount * 0.01 * cgstPercentage);
    let sgstApplied = Math.floor(taxedAmount * 0.01 * sgstPercentage);
    let gstDiff = gstApplied - cgstApplied - sgstApplied;
    if (gstDiff == 1) {
      cgstApplied += 0.5;
      sgstApplied += 0.5;
    } else if (gstDiff == 2) {
      cgstApplied += 1;
      sgstApplied += 1;
    }

    let totalPrice = taxedAmount + cgstApplied + sgstApplied;
    let adjustedDiscount = sellingPrice - taxedAmount;
    return {
      taxedAmount,
      cgstApplied,
      sgstApplied,
      totalPrice,
      adjustedDiscount
    };
}

module.exports = {
  calculateMetalPrice,
  calculateMakingRate,
  calculateMakingCharge,
  calculatePrice,
  calculateMetalPurchaseRate,
  calculateMetalPurchaseRateDiff,
  calculateCostPrice,
  calculateGSTAppliedTotals,
  calculateGSTInplaceTotals
};
