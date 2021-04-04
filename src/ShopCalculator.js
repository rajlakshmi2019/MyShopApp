function calculateMetalPrice(weight, metalRate, purity) {
  return Math.round(weight*metalRate*purity);
}

function calculateMakingRate(makingRate, appliedGradeMakingRateDiff, newGradeMakingRateDiff) {
  return makingRate - appliedGradeMakingRateDiff + newGradeMakingRateDiff;
}

function calculateMakingCharge(weight, makingRate, minimumMaking,
  appliedGradeMakingDiff, newGradeMakingDiff, diffUnit, mmDiffUnit) {
  return Math.round(Math.max(weight*calculateMakingRate(makingRate, appliedGradeMakingDiff["DIFF"] * diffUnit, newGradeMakingDiff["DIFF"] * diffUnit),
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
  salesAmount, discount, cgstPercentage, sgstPercentage) {
    let taxedAmount = salesAmount - discount;
    return getGSTTotals(taxedAmount, discount, cgstPercentage, sgstPercentage);
  }

function calculateGSTInplaceTotals(
  salesAmount, totalAmount, cgstPercentage, sgstPercentage) {
    let taxedAmount = Math.round(totalAmount / (1 + 0.01 * (cgstPercentage + sgstPercentage)));
    let adjustedDiscount = salesAmount - taxedAmount;
    return getGSTTotals(taxedAmount, adjustedDiscount, cgstPercentage, sgstPercentage);
}

function getGSTTotals(taxedAmount, adjustedDiscount, cgstPercentage, sgstPercentage) {
  let cgstApplied = Math.round(taxedAmount * cgstPercentage) / 100;
  let sgstApplied = Math.round(taxedAmount * sgstPercentage) / 100;
  let gstApplied = cgstApplied + sgstApplied;
  let totalAmountRaw = taxedAmount + gstApplied;
  let totalAmount = Math.round(totalAmountRaw);
  let roundOff = Math.round((totalAmount - totalAmountRaw) * 100) / 100;

  return {
    taxedAmount,
    adjustedDiscount,
    gstApplied,
    cgstApplied,
    sgstApplied,
    totalAmount,
    roundOff
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
