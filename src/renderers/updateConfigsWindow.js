const {ipcRenderer, remote} = require("electron");
const {clearSelection} = require("./../utils.js");
const ShopCalculator = require("./../ShopCalculator.js");
const Dao = remote.require("./Dao.js");

/* ESC key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 109 || e.keyCode == 27) {
    window.close();
  }
}

// Populate rates
let metalRate = Dao.getTodaysRate();
let purchaseRateDiff = Dao.getPurchaseRateDiff();
let purchaseRate = {
  "Gold": ShopCalculator.calculateMetalPurchaseRate(Number(metalRate.Gold), purchaseRateDiff.Gold),
  "Silver": ShopCalculator.calculateMetalPurchaseRate(Number(metalRate.Silver), purchaseRateDiff.Silver)
};
document.getElementById("gold-rate-sell").value = metalRate.Gold;
document.getElementById("gold-rate-purchase").value = purchaseRate.Gold;
document.getElementById("silver-rate-sell").value = metalRate.Silver;
document.getElementById("silver-rate-purchase").value = purchaseRate.Silver;

/* Done Button Event Listener */
let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  let goldRateSell = document.getElementById("gold-rate-sell");
  let goldRatePurchase = document.getElementById("gold-rate-purchase");
  let silverRateSell = document.getElementById("silver-rate-sell");
  let silverRatePurchase = document.getElementById("silver-rate-purchase");
  if (isNaN(Number(goldRateSell.value))) {
    goldRateSell.style.borderColor = "red";
    return;
  } else if (isNaN(Number(goldRatePurchase.value))) {
    goldRatePurchase.style.borderColor = "red";
    return;
  } else if (isNaN(Number(silverRateSell.value))) {
    silverRateSell.style.borderColor = "red";
    return;
  } else if (isNaN(Number(silverRatePurchase.value))) {
    silverRatePurchase.style.borderColor = "red";
    return;
  } else if (
    Number(goldRateSell.value) != metalRate.Gold ||
    Number(silverRateSell.value) != metalRate.Silver ||
    Number(goldRatePurchase.value) != purchaseRate.Gold ||
    Number(silverRatePurchase.value) != purchaseRate.Silver) {
      let updatedMetalRate = {
        Gold: Number(goldRateSell.value),
        Silver: Number(silverRateSell.value)
      };
      let updatedPurchaseRate = {
        Gold: ShopCalculator.calculateMetalPurchaseRateDiff(
          Number(goldRateSell.value), Number(goldRatePurchase.value)),
        Silver: ShopCalculator.calculateMetalPurchaseRateDiff(
          Number(silverRateSell.value), Number(silverRatePurchase.value))
      };

      Dao.updateMetalRate(updatedMetalRate, updatedPurchaseRate);
    }
  window.close();
  clearSelection();
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});
