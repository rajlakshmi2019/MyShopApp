function calculateMetalPrice(weight, metalRate, purity) {
  return Math.round(weight*metalRate*purity);
}

function calculateMakingRate(makingRate, appliedGradeMakingRateDiff, newGradeMakingRateDiff) {
  return makingRate - appliedGradeMakingRateDiff + newGradeMakingRateDiff;
}

function calculateMakingCharge(weight, makingRate, minimumMaking,
  appliedGradeMakingDiff, newGradeMakingDiff, diffUnit, mmDiffUnit) {
  return Math.round(Math.max(weight*calculateMakingRate(makingRate,
    appliedGradeMakingDiff["DIFF"] * diffUnit, newGradeMakingDiff["DIFF"] * diffUnit),
    calculateMakingRate(minimumMaking, appliedGradeMakingDiff["MM_DIFF"] * mmDiffUnit,
    newGradeMakingDiff["MM_DIFF"] * mmDiffUnit)));
}

function calculateOfferPrice(price, discountOffer) {
  if (discountOffer != null) {
    return calculateOfferPrice2(price, discountOffer.isFlatDiscount, discountOffer.value);
  }

  return price;
}

function calculateOfferPrice2(price, isFlatDiscount, discountValue) {
  return isFlatDiscount ? price - discountValue : price * (1 - 0.01 * discountValue);
}

function calculatePriceAndOfferPrice(weight, metalRate, offerMetalRate, makingRate,
  offerMakingRate, minimumMaking, purity, appliedGradeMakingDiff, newGradeMakingDiff,
  diffUnit, offerDiffUnit, mmDiffUnit, cgstPercentage, sgstPercentage, discountOffer) {
    let metalPrice = calculateMetalPrice(weight, metalRate, purity);
    let offerMetalPrice = calculateMetalPrice(weight, offerMetalRate, purity);
    let makingCharge = calculateMakingCharge(weight, makingRate, minimumMaking,
      appliedGradeMakingDiff, newGradeMakingDiff, diffUnit, mmDiffUnit);
    let offerMakingCharge = calculateMakingCharge(weight, offerMakingRate, minimumMaking,
      appliedGradeMakingDiff, newGradeMakingDiff, offerDiffUnit, mmDiffUnit);
    let gstApplied = calculateGST(metalPrice + makingCharge, cgstPercentage, sgstPercentage);
    let offerGstApplied = calculateGST(offerMetalPrice + offerMakingCharge, cgstPercentage, sgstPercentage);
    let totalPrice = metalPrice + makingCharge + gstApplied.total;
    let offerTotalPrice = offerMetalPrice + offerMakingCharge + offerGstApplied.total;

    return {
      totalPrice,
      offerTotalPrice,
      metalPrice,
      offerMetalPrice,
      makingCharge,
      offerMakingCharge,
      gstApplied,
      offerGstApplied
    };
  }

function calculatePrice(weight, metalRate, makingRate, minimumMaking, purity,
  appliedGradeMakingDiff, newGradeMakingDiff, diffUnit, mmDiffUnit,
  cgstPercentage, sgstPercentage, discountOffer) {
  let offerMetalRate = calculateOfferPrice(metalRate, discountOffer != null ? discountOffer.metalRate : null);
  let offerMakingRate = calculateOfferPrice(makingRate, discountOffer != null ? discountOffer.makingCharge : null);
  return calculatePriceAndOfferPrice(weight, metalRate, offerMetalRate,
    makingRate, offerMakingRate, minimumMaking, purity, appliedGradeMakingDiff,
    newGradeMakingDiff, diffUnit, diffUnit, mmDiffUnit, cgstPercentage, sgstPercentage, discountOffer);
}

function calculatePriceByPercentageMaking(weight, metalRate, percentageMakingRate, minimumMaking, purity,
  appliedGradeMakingDiff, newGradeMakingDiff, percentageDiffUnit, mmDiffUnit,
  cgstPercentage, sgstPercentage, discountOffer) {
  let makingRate = metalRate * 0.01 * percentageMakingRate;
  let diffUnit = metalRate * 0.01 * percentageDiffUnit;

  let offerMetalRate = calculateOfferPrice(metalRate, discountOffer != null ? discountOffer.metalRate : null);
  let discountOfferMakingCharge = null;
  let discountOfferDiffUnit = null;
  if (discountOffer !== null && discountOffer.makingCharge !== null) {
    discountOfferMakingCharge = {
      isFlatDiscount: discountOffer.makingCharge.isFlatDiscount,
      value: discountOffer.makingCharge.isFlatDiscount ? offerMetalRate * 0.01 * discountOffer.makingCharge.value : discountOffer.makingCharge.value
    };

    discountOfferDiffUnit = {
      isFlatDiscount: discountOffer.makingCharge.isFlatDiscount,
      value: discountOffer.makingCharge.isFlatDiscount ? 0 : discountOffer.makingCharge.value
    };
  }
  let offerMakingRate = calculateOfferPrice(offerMetalRate * 0.01 * percentageMakingRate, discountOfferMakingCharge);
  let offerDiffUnit = calculateOfferPrice(offerMetalRate * 0.01 * percentageDiffUnit, discountOfferDiffUnit);
  return calculatePriceAndOfferPrice(weight, metalRate, offerMetalRate,
    makingRate, offerMakingRate, minimumMaking, purity, appliedGradeMakingDiff,
    newGradeMakingDiff, diffUnit, offerDiffUnit, mmDiffUnit, cgstPercentage, sgstPercentage, discountOffer);
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
  calculateOfferPrice,
  calculatePrice,
  calculatePriceByPercentageMaking,
  calculateMetalPurchaseRate,
  calculateMetalPurchaseRateDiff,
  calculateCostPrice,
  calculateGSTAppliedTotals,
  calculateGSTInplaceTotals
};
