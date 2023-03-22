const {ipcRenderer, remote} = require("electron");
const {clearSelection} = require("./../utils.js");

/* ESC key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 109 || e.keyCode == 27) {
    window.close();
  }
}

let tabDetails = remote.getCurrentWindow().tabDetails;
document.getElementById("gold-rate-main").value = tabDetails.metalSellingRate["Gold"].discounted;
document.getElementById("silver-rate-main").value = tabDetails.metalSellingRate["Silver"].discounted;
document.getElementById("gold-making-main").value = tabDetails.percentageMaking["Gold"].discounted;

/* Done Button Event Listener */
let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  let goldSellingRate = tabDetails.metalSellingRate["Gold"].original;
  let goldSellingRateDiscount = null;
  let newGoldSellingRate = Number(document.getElementById("gold-rate-main").value);
  if (!isNaN(newGoldSellingRate)) {
    if (newGoldSellingRate < goldSellingRate) {
      goldSellingRateDiscount = goldSellingRate - newGoldSellingRate;
    } else {
      goldSellingRate = newGoldSellingRate;
      goldSellingRateDiscount = 0;
    }
  }

  let silverSellingRate = tabDetails.metalSellingRate["Silver"].original;
  let silverSellingRateDiscount = null;
  let newSilverSellingRate = Number(document.getElementById("silver-rate-main").value);
  if (!isNaN(newSilverSellingRate)) {
    if (newSilverSellingRate < silverSellingRate) {
      silverSellingRateDiscount = silverSellingRate - newSilverSellingRate;
    } else {
      silverSellingRate = newSilverSellingRate;
      silverSellingRateDiscount = 0;
    }
  }

  let goldMakingRate = tabDetails.percentageMaking["Gold"].original;
  let goldMakingRateDiscount = null;
  let newGoldMakingRate = Number(document.getElementById("gold-making-main").value);
  if (!isNaN(newGoldMakingRate)) {
    if (newGoldMakingRate < goldMakingRate) {
      goldMakingRateDiscount = goldMakingRate - newGoldMakingRate;
    } else {
      goldMakingRate = newGoldMakingRate;
      goldMakingRateDiscount = 0;
    }
  }

  let silverMakingRate = tabDetails.percentageMaking["Silver"];
  let silverMakingRateDiscount = null;

  ipcRenderer.send('update:selected:grade', {tabIndex: tabDetails.tabIndex,
    metalSellingRate: {"Gold": goldSellingRate, "Silver": silverSellingRate},
    metalSellingRateDiscount: {"Gold": goldSellingRateDiscount, "Silver": silverSellingRateDiscount},
    percentageMakingRate: {"Gold": goldMakingRate, "Silver": silverMakingRate},
    percentageMakingRateDiscount: {"Gold": goldMakingRateDiscount, "Silver": silverMakingRateDiscount}
  });
  clearSelection();
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});
