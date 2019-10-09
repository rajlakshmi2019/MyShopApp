function calculateMetalPrice(weight, metalRate, purity) {
  return weight*metalRate*purity;
}

function calculateGradeMakingRate(makingRate, appliedGradeMakingRateDiff, newGradeMakingRateDiff) {
  return makingRate - appliedGradeMakingRateDiff + newGradeMakingRateDiff;
}

function calculateGradeMakingCharge(weight, makingRate, minimumMaking,
  appliedGradeMakingDiff, newGradeMakingDiff, diffUnit, mmDiffUnit) {
  return Math.max(weight*calculateGradeMakingRate(makingRate, appliedGradeMakingDiff["DIFF"] * diffUnit, newGradeMakingDiff["DIFF"] * diffUnit),
    calculateGradeMakingRate(minimumMaking, appliedGradeMakingDiff["MM_DIFF"] * mmDiffUnit, newGradeMakingDiff["MM_DIFF"] * mmDiffUnit));
}

function calculateGardePrice(weight, metalRate, makingRate, minimumMaking, purity,
  appliedGradeMakingDiff, newGradeMakingDiff, diffUnit, mmDiffUnit) {
  return calculateMetalPrice(weight, metalRate, purity) + calculateGradeMakingCharge(weight, makingRate,
    minimumMaking, appliedGradeMakingDiff, newGradeMakingDiff, diffUnit, mmDiffUnit);
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

function calculateGSTAppliedTotals(
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
  calculateGradeMakingRate,
  calculateGradeMakingCharge,
  calculateGardePrice,
  calculateMetalPurchaseRate,
  calculateMetalPurchaseRateDiff,
  calculateCostPrice,
  calculateGSTAppliedTotals
};
