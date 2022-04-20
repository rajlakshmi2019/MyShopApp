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
document.getElementById("grade-" + tabDetails.appliedPriceGrade.toLowerCase()).checked = true;

/* Done Button Event Listener */
let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  let grade = document.querySelector("input[name=grades]:checked").value;
  ipcRenderer.send('update:selected:grade', {newGrade: grade, tabIndex: tabDetails.tabIndex});
  clearSelection();
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});
