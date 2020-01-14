const {ipcRenderer, remote} = require("electron");
const {clearSelection, createHtmlElement, getDesiNumber} = require("./../utils.js");
const ShopCalculator = require("./../ShopCalculator.js");
const Dao = remote.require("./Dao.js");

/* ESC key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 27) {
    window.close();
  }
}

/* NumKey - key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 109) {
    window.close();
  }
}

/* Done Button Event Listener */
let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  window.close();
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});

let prices = remote.getCurrentWindow().priceCardDetails;
let itemColor = "accessories-color";
if (prices.metal === 'Gold') {
  itemColor = "gold-color";
} else if (prices.metal === 'Silver') {
  itemColor = "silver-color";
}

document.querySelector(".main-div").classList.add(itemColor);
document.getElementById("item-name-label").innerHTML = prices.itemName;
document.getElementById("weight-label").innerHTML = prices.weight + " g";
document.getElementById("metal-selling-price").innerHTML =
  prices.metal + " ₹ " + getDesiNumber(prices.ratePerGram) + " /g";
document.getElementById("minimum-making-label").innerHTML =
  "₹ " + getDesiNumber(prices.minimumMakingCharge) + "  minimun making";

let metalRate = Dao.getTodaysRate();
let purchaseRateDiff = Dao.getPurchaseRateDiff();
let mappedItem = Dao.getMappedItem([prices.metal, prices.itemName].toString());

let afterWastage = mappedItem.ESTIMATE + mappedItem.WASTE;
let costRate = mappedItem.METAL === 'Gold' ? metalRate.Gold :
  ShopCalculator.calculateMetalPurchaseRate(metalRate[mappedItem.METAL], purchaseRateDiff[mappedItem.METAL]);
let costPrice =
  ShopCalculator.calculateCostPrice(prices.weight, costRate, afterWastage);

document.getElementById("cost-price-label").innerHTML = "₹ " + getDesiNumber(costPrice);
document.getElementById("metal-cost-price").innerHTML = prices.metal + " ₹ " + getDesiNumber(costRate) + " /g";
document.getElementById("item-westage").innerHTML = "at " + Math.round(afterWastage * 100 * 100) / 100 + "% + wastage";

let gradesList = Dao.getGradesList();
let gradeMakingRateDiff = Dao.getGradeMakingRateDiff();
let appliedGrade = prices.appliedPriceGrade;

for (let i=0; i<gradesList.length; i++) {
  addGradePriceLabels(gradesList[i]);
}

function addGradePriceLabels(grade) {

  let makingRate = ShopCalculator.calculateGradeMakingRate(prices.makingPerGram,
    gradeMakingRateDiff[appliedGrade][mappedItem.METAL].DIFF * mappedItem.DIFF_UNIT,
    gradeMakingRateDiff[grade][mappedItem.METAL].DIFF * mappedItem.DIFF_UNIT);

  let makingCharge = ShopCalculator.calculateGradeMakingCharge(
    prices.weight, prices.makingPerGram, prices.minimumMakingCharge,
    gradeMakingRateDiff[appliedGrade][mappedItem.METAL],
    gradeMakingRateDiff[grade][mappedItem.METAL],
    mappedItem.DIFF_UNIT, mappedItem.MM_DIFF_UNIT);

  let sellingPrice = ShopCalculator.calculateGardePrice(
    prices.weight, prices.ratePerGram, prices.makingPerGram, prices.minimumMakingCharge, mappedItem.APPLIED,
    gradeMakingRateDiff[appliedGrade][mappedItem.METAL],
    gradeMakingRateDiff[grade][mappedItem.METAL],
    mappedItem.DIFF_UNIT, mappedItem.MM_DIFF_UNIT);

  let profit = sellingPrice - costPrice;

  document.getElementById("making-per-gram-" + grade.toLowerCase()).innerHTML = "₹ " + getDesiNumber(makingRate) + " /g";
  document.getElementById("making-charge-" + grade.toLowerCase()).innerHTML = "₹ " + getDesiNumber(makingCharge);
  document.getElementById("item-price-" + grade.toLowerCase()).innerHTML = "₹ " + getDesiNumber(sellingPrice);
  document.getElementById("profit-at-price-" + grade.toLowerCase()).innerHTML = "+ ₹ " + getDesiNumber(profit);
}
