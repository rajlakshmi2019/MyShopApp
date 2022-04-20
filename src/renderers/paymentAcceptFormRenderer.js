const {ipcRenderer, remote} = require("electron");
const {clearSelection, isMobileNumber, getDesiNumber, getRupeeDesiNumber, getFromDesiRupeeNumber} = require("./../utils.js");

/* ESC key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 109 || e.keyCode == 27) {
    window.close();
  }
}

let billParams = remote.getCurrentWindow().configs;
let mobileNoInput = document.getElementById("mobile-no-input");
if (isMobileNumber(billParams.tabName)) {
  mobileNoInput.value = billParams.tabName;
  mobileNoInput.disabled = true;
}

mobileNoInput.addEventListener('keyup', function() {
  if (isMobileNumber(this.value)) {
    this.style.borderColor = "green";
  } else {
    this.style.borderColor = "red";
  }
});

let netTotal = getFromDesiRupeeNumber(billParams.totals.total_bill);
document.getElementById("net-total").innerHTML = billParams.totals.total_bill;
document.getElementById("net-total").classList.add(netTotal < 0 ? "red-color" : "money-green");
document.getElementById("payment-input").addEventListener('keyup', function() {
  if (isNaN(Number(this.value))) {
    this.style.borderColor = "red";
  } else {
    this.style.borderColor = "green";
    let thisValue = Number(this.value);
    let pendingTotal = netTotal- (netTotal < 0 ? -1 * thisValue : thisValue);
    document.getElementById("pending-total").innerHTML=
      "₹ " + (pendingTotal > 0 ? getDesiNumber(pendingTotal) : 0);
  }
});

if(netTotal < 0) {
  document.getElementById("due-input").disabled = true;
}
document.getElementById("due-input").addEventListener('keyup', function() {
  if (isNaN(Number(this.value))) {
    this.style.borderColor = "red";
  } else {
    this.style.borderColor = "green";
  }
});

let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  let mobileNoInputVal = document.getElementById("mobile-no-input").value;
  let paymentInputVal = document.getElementById("payment-input").value;
  let dueInputVal = document.getElementById("due-input").value;
  if ((mobileNoInputVal === "" || isMobileNumber(mobileNoInputVal)) &&
    !isNaN(Number(paymentInputVal)) && !isNaN(Number(dueInputVal))) {
      if (isMobileNumber(mobileNoInputVal)) {
        billParams.tabName = mobileNoInputVal;
        ipcRenderer.send('mobile-no:update', billParams);
      }

      let billTotalVal = paymentInputVal === "" ? netTotal : Math.sign(netTotal) * Number(paymentInputVal);
      billParams.totals.total_bill = getRupeeDesiNumber(billTotalVal);

      billParams.totals.discount = "₹ " + getDesiNumber(getFromDesiRupeeNumber(billParams.totals.discount) +
        getFromDesiRupeeNumber(document.getElementById("pending-total").innerHTML));

      billParams.totals.pending_amount = "₹ " + getDesiNumber(Number(dueInputVal));

      // Adjust discount for non-gst bill
      if (billTotalVal < billParams.totals.total_bill_less_gst_val) {
        billParams.totals.total_bill_less_gst = billParams.totals.total_bill;
        billParams.totals.discount_less_gst = "₹ " + getDesiNumber(billParams.totals.sub_total_less_gst_val - billTotalVal);
      }

      billParams.type = "EST";
      ipcRenderer.send('bill:create', billParams);
      clearSelection();
      window.close();
  }
});

submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});
