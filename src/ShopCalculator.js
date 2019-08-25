function calculateMetalPrice(weight, metalRate, purity) {
  return weight*metalRate*purity;
}

function calculateGradeMakingRate(makingRate, appliedGradeMakingRateDiff, newGradeMakingRateDiff) {
  return makingRate - appliedGradeMakingRateDiff + newGradeMakingRateDiff;
}

function calculateGradeMakingCharge(weight, makingRate, minimumMaking, appliedGradeMakingDiff, newGradeMakingDiff) {
  return Math.max(weight*calculateGradeMakingRate(makingRate, appliedGradeMakingDiff["DIFF"], newGradeMakingDiff["DIFF"]),
    calculateGradeMakingRate(minimumMaking, appliedGradeMakingDiff["MM_DIFF"], newGradeMakingDiff["MM_DIFF"]));
}

function calculateGardePrice(
  weight, metalRate, makingRate, minimumMaking, purity, appliedGradeMakingDiff, newGradeMakingDiff) {
  return calculateMetalPrice(weight, metalRate, purity) +
    calculateGradeMakingCharge(weight, makingRate, minimumMaking, appliedGradeMakingDiff, newGradeMakingDiff);
}

function calculateMetalPurchaseRate(metalRate, purchaseRateDiff) {
  return metalRate + purchaseRateDiff;
}

function calculateCostPrice(weight, costRate, afterWastage) {
  return weight * costRate * afterWastage;
}

module.exports = {
  calculateMetalPrice,
  calculateGradeMakingRate,
  calculateGradeMakingCharge,
  calculateGardePrice,
  calculateMetalPurchaseRate,
  calculateCostPrice,
};
