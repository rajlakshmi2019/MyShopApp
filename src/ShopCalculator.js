function calculateMetalPrice(weight, metalRate, purity) {
  return weight*metalRate*purity;
}

function calculateGradeMakingRate(makingRate, appliedGradeMakingRateDiff, newGradeMakingRateDiff) {
  return makingRate - appliedGradeMakingRateDiff + newGradeMakingRateDiff;
}

function calculateGradeMakingCharge(weight, makingRate, minimumMaking, appliedGradeMakingRateDiff, newGradeMakingRateDiff) {
  return Math.max(weight*calculateGradeMakingRate(
    makingRate, appliedGradeMakingRateDiff, newGradeMakingRateDiff), minimumMaking);
}

function calculateGardePrice(
  weight, metalRate, makingRate, minimumMaking, purity, appliedGradeMakingRateDiff, newGradeMakingRateDiff) {
  return calculateMetalPrice(weight, metalRate, purity) +
    calculateGradeMakingCharge(weight, makingRate, minimumMaking, appliedGradeMakingRateDiff, newGradeMakingRateDiff);
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
