const {ipcRenderer, remote} = require("electron");
const {isMobileNumber, getDesiNumber, getRupeeDesiNumber, getFromDesiRupeeNumber,
  formatDate, formatDateSlash, borderColorOnNumberCheck, borderColorOnEmptyCheck,
  borderColorOnMobileNumberCheck, borderColorOnAlphabetsOnlyCheck,
  padStringWithZeros, toTitleCase, getFinancialYear} = require("./../utils.js");
const {calculateGSTInplaceTotals, calculateGSTAppliedTotals} = require("./../ShopCalculator.js");
const Dao = remote.require("./Dao.js");

/* ESC key event handling */
/* NumKey - key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 109 || e.keyCode == 27) {
    window.close();
  }
}

let billParams = remote.getCurrentWindow().configs;
let netTotal = getFromDesiRupeeNumber(billParams.totals.total_bill);
document.getElementById("net-total").innerHTML = billParams.totals.total_bill;
document.getElementById("net-total").classList.add(netTotal < 0 ? "red-color" : "money-green");
document.getElementById("gst-payment-input").addEventListener('keyup', function() {
  if (isNaN(Number(this.value))) {
    this.style.borderColor = "red";
  } else {
    this.style.borderColor = "green";
    if (this.value === "") {
      updateBreakupDetails(0);
    } else {
      let thisValue = Number(this.value);
      let paidAmountDiff = netTotal- (netTotal < 0 ? -1 * thisValue : thisValue);
      updateBreakupDetails(paidAmountDiff);
    }
  }
});

document.querySelector(".reject-button").addEventListener('click', window.close);
document.querySelector(".accept-button").addEventListener('click', () => {
  if (document.querySelector(".selected-section").id === "first-section") {
    if (isFirstSectionInputValid()) {
      document.getElementById("first-section").classList.remove("selected-section");
      document.getElementById("first-section").classList.add("display-none");
      document.getElementById("second-section").classList.add("selected-section");
      document.getElementById("second-section").classList.remove("display-none");
    }
  } else if (document.querySelector(".selected-section").id === "second-section") {
    if (isSecondSectionInputValid()) {
      document.getElementById("second-section").classList.remove("selected-section");
      document.getElementById("second-section").classList.add("display-none");
      document.getElementById("last-section").classList.add("selected-section");
      document.getElementById("last-section").classList.remove("display-none");
      document.querySelector(".accept-button").innerHTML = "Submit";
    }
  } else {
    if (isLastSectionInputValid()) {
      updateBillParams();

      if (isMobileNumber(billParams.gstPhoneNumber)) {
        billParams.tabName = billParams.gstPhoneNumber;
        ipcRenderer.send('mobile-no:update', billParams);
      }
      billParams.type = "GST";
      billParams.savable = true;
      ipcRenderer.send('bill:create', billParams);
      window.close();
    }
  }
});

if (isMobileNumber(billParams.tabName)) {
  document.getElementById("phone-no-input").value = billParams.tabName;
  document.getElementById("phone-no-input").style.borderColor = "green";
}
document.getElementById("date-input").value = formatDate(new Date(billParams.bill_date_raw));
document.getElementById("date-input").style.borderColor = "green";

billParams.gstSerialNumber = Dao.getGSTSerialNumber(getFinancialYear(new Date(billParams.bill_date_raw))  + '/');
document.getElementById("invoice-no-input").value = billParams.gstSerialNumber;
document.getElementById("invoice-no-input").style.borderColor = "green";
document.getElementById("invoice-no-input").addEventListener('keyup', borderColorOnNumberCheck);

document.getElementById("name-input").addEventListener('keyup', borderColorOnAlphabetsOnlyCheck);
document.getElementById("address-input").addEventListener('keyup', borderColorOnAlphabetsOnlyCheck);
document.getElementById("phone-no-input").addEventListener('keyup', borderColorOnMobileNumberCheck);
document.getElementById("date-input").addEventListener('change', borderColorOnEmptyCheck);
updateBreakupDetails(0);

function updateBreakupDetails(paidAmountDiff) {
  let salesTotal = getFromDesiRupeeNumber(billParams.totals.sales);
  let preAppliedDiscount = getFromDesiRupeeNumber(billParams.totals.discount);
  let salesTotalLessGST = getFromDesiRupeeNumber(billParams.totals.sales_less_gst);
  document.getElementById("sales-amount").innerHTML = billParams.totals.sales_less_gst;

  billParams.gstTotals = calculateGSTInplaceTotals(salesTotalLessGST, salesTotal - preAppliedDiscount - paidAmountDiff, getCGSTRate(), getSGSTRate());
  if (billParams.gstTotals.adjustedDiscount < 0) {
    billParams.gstTotals = calculateGSTAppliedTotals(salesTotalLessGST, 0, getCGSTRate(), getSGSTRate());
  }

  document.getElementById("discount").innerHTML = getRupeeDesiNumber(billParams.gstTotals.adjustedDiscount);
  document.getElementById("taxable-amount").innerHTML = getRupeeDesiNumber(billParams.gstTotals.taxedAmount);
  document.getElementById("gst-applied").innerHTML = getRupeeDesiNumber(billParams.gstTotals.gstApplied);
  document.getElementById("total-amount").innerHTML = getRupeeDesiNumber(billParams.gstTotals.totalAmount);
}

function updateBillParams() {
  invoiceDate = new Date(document.getElementById("date-input").value);
  billParams.gstInvoiceNumber = padStringWithZeros(document.getElementById("invoice-no-input").value, 3);
  billParams.gstName = toTitleCase(document.getElementById("name-input").value);
  billParams.gstAddress = toTitleCase(document.getElementById("address-input").value) + ", Jharkhand";
  billParams.gstPhoneNumber = document.getElementById("phone-no-input").value;
  billParams.gstInvoiceDate = formatDateSlash(invoiceDate);
  billParams.gstInvoiceMonth = invoiceDate.toLocaleString('default', {month: 'short'});
  billParams.gstFinancialYear = getFinancialYear(invoiceDate);
}

function isFirstSectionInputValid() {
  return isInputByIdValid("gst-payment-input");
}

function isSecondSectionInputValid() {
  return isInputByIdValid("invoice-no-input") && isInputByIdValid("name-input")
    && isInputByIdValid("address-input") && isInputByIdValid("phone-no-input");
}

function isLastSectionInputValid() {
  return isInputByIdValid("date-input");
}

function isInputByIdValid(inputId) {
  return isInputValid(document.getElementById(inputId));
}

function isInputValid(input) {
  return input.style.borderColor !== "red";
}

function getCGSTRate() {
  return 1.5;
}

function getSGSTRate() {
  return 1.5;
}
