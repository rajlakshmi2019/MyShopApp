const {ipcRenderer, remote} = require("electron");
const {clearSelection, getDesiNumber, getFromDesiRupeeNumber} = require("./../utils.js");

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

let configs = remote.getCurrentWindow().configs;
let netTotal = getFromDesiRupeeNumber(configs.netTotal)
document.getElementById("net-total").innerHTML = configs.netTotal;
document.getElementById("payment-input").addEventListener('keyup', function() {
  if (isNaN(Number(this.value))) {
    this.style.borderColor = "red";
  } else {
    let pendingTotal = netTotal - Number(this.value);
    document.getElementById("pending-total").innerHTML=
      "₹ " + (pendingTotal > 0 ? getDesiNumber(pendingTotal) : 0);
  }
});

let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  let paymentInput = document.getElementById("payment-input");
  if (paymentInput.value == "") {
    window.close();
  } else if (!isNaN(Number(paymentInput.value))) {
    let pendingOpt = document.querySelector("input[name=pending-opt]:checked").value;
    ipcRenderer.send('update:pending', {
      markAs: pendingOpt,
      pending: getFromDesiRupeeNumber(document.getElementById("pending-total").innerHTML),
      paid: Number(paymentInput.value),
      tabIndex: configs.tabIndex
    });
    clearSelection();
  } else {
    paymentInput.style.borderColor = "red";
  }
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});
