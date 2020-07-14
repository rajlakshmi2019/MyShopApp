const {ipcRenderer, remote} = require("electron");
const {clearSelection,isMobileNumber} = require("./../utils.js");

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

let params = remote.getCurrentWindow().params;

document.getElementById("mobile-no-input").addEventListener('keyup', function() {
  if (isMobileNumber(this.value)) {
    this.style.borderColor = "green";
  } else {
    this.style.borderColor = "red";
  }
});

let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  params.tabName = document.getElementById("mobile-no-input").value;
  ipcRenderer.send('mobile-no:update', params);
  clearSelection();
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});
