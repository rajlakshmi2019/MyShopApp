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

document.getElementById("from-date").value = remote.getCurrentWindow().fromDate;
document.getElementById("to-date").value = formatDate(new Date());

/* Done Button Event Listener */
let submitButton = document.getElementById("submit-button");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  let fromDate = document.getElementById("from-date").value;
  let toDate = document.getElementById("to-date").value;
  if (fromDate && toDate && fromDate !== toDate) {
    Dao.carryOverStock(fromDate, toDate, generateTransactionId(new Date()));
    windowFactory.getTransactionsReportView().webContents.send('update:date', {"Date": toDate});
    window.close();
  }
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});


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
