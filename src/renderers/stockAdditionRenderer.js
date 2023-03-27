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

document.getElementById("addition-date").value = remote.getCurrentWindow().additionDate;

/* Done Button Event Listener */
let submitButton = document.getElementById("submit-button");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  let additionDate = document.getElementById("addition-date").value;
  let goldWeightValue = document.getElementById("gold-weight").value;
  let silverWeightValue = document.getElementById("silver-weight").value;
  let cashValue = document.getElementById("cash").value;
  if (additionDate && isValidValue(goldWeightValue) && isValidValue(silverWeightValue) && isValidValue(cashValue)) {
    Dao.addStockEntries(additionDate, generateTransactionId(new Date()), Number(goldWeightValue), Number(silverWeightValue), Number(cashValue));
    windowFactory.getTransactionsReportView().webContents.send('update:date', {"Date": additionDate});
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
