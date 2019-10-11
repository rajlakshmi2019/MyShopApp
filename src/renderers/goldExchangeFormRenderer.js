const {ipcRenderer, remote} = require("electron");
const {clearSelection, getInputTextFloatValue} = require("./../utils.js");
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

// Populate rates
let metalRate = Dao.getTodaysRate();
let purchaseRateDiff = Dao.getPurchaseRateDiff();
document.getElementById("gold-rate-sell").value = metalRate.Gold;
document.getElementById("gold-rate-purchase").value =
  ShopCalculator.calculateMetalPurchaseRate(Number(metalRate.Gold), purchaseRateDiff.Gold);
document.getElementById("silver-rate-sell").value = metalRate.Silver;
document.getElementById("silver-rate-purchase").value =
  ShopCalculator.calculateMetalPurchaseRate(Number(metalRate.Silver), purchaseRateDiff.Silver);

/* Done Button Event Listener */
let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  submitFormData();
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});

function submitFormData() {
  let setNameElement = document.getElementById("set-name");
  if (setNameElement.value === "") {
    setNameElement.style.borderColor = "red";
    window.close();
    return;
  }

  let goldRateSell = Number(document.getElementById("gold-rate-sell").value);
  let silverRateSell = Number(document.getElementById("silver-rate-sell").value);
  let goldRatePurchase = Number(document.getElementById("gold-rate-purchase").value);
  let silverRatePurchase = Number(document.getElementById("silver-rate-purchase").value);
  let payload = {
    setItems: [],
    setName: setNameElement.value,
    goldRate: goldRateSell,
    goldPurchaseRate: goldRatePurchase,
    silverRate: silverRateSell,
    silverPurchaseRate: silverRatePurchase
  };
  ipcRenderer.send('exchange:create', payload);
}
