const {ipcRenderer, remote} = require("electron");
const {clearSelection, formatDate, generateTransactionId} = require("./../utils.js");
const Dao = remote.require("./Dao.js");
const windowFactory = remote.require("./windowFactory.js");

/* ESC key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 109 || e.keyCode == 27) {
    window.close();
  }
}


document.getElementById("reversal-date").value = remote.getCurrentWindow().reversalDate;

/* Done Button Event Listener */
let submitButton = document.getElementById("submit-button");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  let reversalDate = document.getElementById("reversal-date").value;
  let goldWeightValue = document.getElementById("gold-weight").value;
  let goldAmountValue = document.getElementById("gold-amount").value;
  let silverWeightValue = document.getElementById("silver-weight").value;
  let silverAmountValue = document.getElementById("silver-amount").value;

  if (reversalDate && isValidValue(goldWeightValue) && isValidValue(goldAmountValue) && isValidValue(silverWeightValue) && isValidValue(silverAmountValue)) {
    let reversals = [];
    if (Number(goldWeightValue) && Number(goldAmountValue) > 0) {
      reversals.push({
        "Metal": "Gold",
        "Weight_In_Gram": Number(goldWeightValue),
        "Price": Number(goldAmountValue)
      });
    }

    if (Number(silverWeightValue) && Number(silverAmountValue) > 0) {
      reversals.push({
        "Metal": "Silver",
        "Weight_In_Gram": Number(silverWeightValue),
        "Price": Number(silverAmountValue)
      });
    }

    Dao.addManualTransctionReversals(reversalDate, generateTransactionId(new Date()), reversals);
    windowFactory.getTransactionsReportView().webContents.send('update:date', {"Date": reversalDate});
    window.close();
  }
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});

function isValidValue(value) {
  return !isNaN(Number(value)) && Number(value) >= 0;
}


let cancelButton = document.getElementById("cancel-button");
cancelButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  window.close();
});
cancelButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
  window.close();
});
