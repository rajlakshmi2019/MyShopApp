const {ipcRenderer, remote} = require("electron");
const {createHtmlElement, addTableHeader, addTableData, getDesiNumber, getFromDesiRupeeNumber} = require("./../utils.js");
const {calculateGSTAppliedTotals} = require("./../ShopCalculator.js");
const Dao = remote.require("./Dao.js");

// bill entries and options
let configs = remote.getCurrentWindow().configs;

// add print button
let printButtonDiv = createHtmlElement("div", "no-print", "print-button-div", null, null);
document.getElementById("bill-menu").appendChild(printButtonDiv);

let printButton = createHtmlElement("button", null, "print-button", null, "Print");
printButtonDiv.appendChild(printButton);
printButton.addEventListener("click", () => {
  window.print();
});

let gstButton = createHtmlElement("button", null, "gst-button", null, "GST");
printButtonDiv.appendChild(gstButton);
gstButton.addEventListener("click", () => {
  if (document.getElementById("top-center-header").textContent === "ESTIMATE ONLY") {
    applyGST()
  } else if (document.getElementById("top-center-header").textContent === "TAX INVOICE") {
    applyEstimate()
  }
});

// populate header
document.getElementById("top-center-header").textContent = "ESTIMATE ONLY";
document.getElementById("top-right-header").textContent = "Mob: 9431156469, 8797558240";

// general info
document.getElementById("bill-no").textContent = configs.id;
document.getElementById("billing-date").textContent = configs.bill_date;

// sales table in bill
if (configs.sales.length > 0 || configs.additional > 0) {
  configs.sales = configs.sales.sort(compare);

  let salesBillTable = createHtmlElement("table", "bill-table print-friendly", null, null, null);
  document.getElementById("bill-sales").appendChild(salesBillTable);

  let thr = addTableHeader(
    salesBillTable, ["Item", "Qty", "Weight", "Breakup", "Price"]);
  thr.className = "sales-header";

  for (let i=0; i<configs.sales.length; i++) {
    let entry = configs.sales[i];
    entry.items = entry.items.sort(compare);
    for (let j=0; j<entry.items.length; j++) {
      let item = entry.items[j].Item;
      if (entry.items[j].Item.startsWith("Fancy")) {
        console.log(["Silver", entry.items[j].Item].toString());
        item += " " + (Dao.getMappedItem(["Silver", entry.items[j].Item].toString()).APPLIED * 1000);
      }

      let qty = entry.items[j].Quantity;
      let weight = parseFloat(Math.round(entry.items[j].Weight_In_Gram * 100) / 100).toFixed(2) + "g";
      let price = "₹ " + getDesiNumber(entry.items[j].Price);

      var cl = "sales-row", breakup = "";
      if (j == entry.items.length - 1) {
        cl += " section-end";
        var rate = entry.Metal.charAt(0) + " " + entry.Rate_Per_Gram + "/g";
        var making = (entry.Making_Per_Gram == null ?
          entry.Making + "/pc" : entry.Making_Per_Gram + "/g");
        breakup = rate + " + " + making;
      }

      let tableRow = [
        wrapTableData(document.createTextNode(item), "left"),
        wrapTableData(document.createTextNode(qty), "right"),
        wrapTableData(document.createTextNode(weight), "right"),
        wrapTableData(document.createTextNode(breakup), "right"),
        wrapTableData(document.createTextNode(price), "right")];

      let tr = addTableData(salesBillTable, tableRow);
      tr.className  = cl;
    }
  }

  // additional charge for Munga/Moti/Mala
  if (configs.additional > 0) {
    let tableRow = [
      wrapTableData(document.createTextNode("Munga/Moti/Mala"), "left"),
      wrapTableData(document.createTextNode(""), "right"),
      wrapTableData(document.createTextNode(""), "right"),
      wrapTableData(document.createTextNode(""), "right"),
      wrapTableData(document.createTextNode("₹ " + configs.additional), "right")];

    let tr = addTableData(salesBillTable, tableRow);
    tr.className  = "sales-row section-end";
  }

  // sales total
  let salesTotal = createHtmlElement("div", "td-align-right section-close", null, null, configs.totals.sales);
  document.getElementById("bill-sales").appendChild(salesTotal);
}

// purchase table
if (configs.purchase.length > 0) {
  configs.purchase = configs.purchase.sort(compare);
  document.getElementById("bill-purchase").classList.add("display-block");

  let purchaseBillTable = createHtmlElement("table", "bill-table print-friendly", null, null, null);
  document.getElementById("bill-purchase").appendChild(purchaseBillTable);

  let thr = addTableHeader(
    purchaseBillTable, ["Exchange", "", "", "Price"]);
  thr.className = "purchase-header";

  for (let i=0; i<configs.purchase.length; i++) {
    let entry = configs.purchase[i];
    let tableRow = [
      wrapTableData(document.createTextNode("Old " + entry.Metal), "left"),
      wrapTableData(document.createTextNode(" "), "right"),
      wrapTableData(document.createTextNode(" "), "right"),
      wrapTableData(document.createTextNode("₹ " + getDesiNumber(entry.Price)), "right")];
    // let tableRow = [
    //   wrapTableData(document.createTextNode(entry.Metal), "left"),
    //   wrapTableData(document.createTextNode(entry.Weight_In_Gram + "g"), "right"),
    //   wrapTableData(document.createTextNode(entry.Metal.charAt(0) + " " +
    //     entry.Purchase_Rate_Per_Gram + "/g" + " @" + entry.Purity), "right"),
    //   wrapTableData(document.createTextNode("₹ " + getDesiNumber(entry.Price)), "right")];

    let cl = "purchase-row";
    if (i == configs.purchase.length - 1) {
      cl+= " section-end";
    }

    let tr = addTableData(purchaseBillTable, tableRow);
    tr.className  = cl;
  }

  // purchase total
  let purchaseTotal = createHtmlElement("div", "td-align-right section-close", null, null, configs.totals.purchase);
  document.getElementById("bill-purchase").appendChild(purchaseTotal);

  // add purchase block at end in gst bills with page break
  document.getElementById("bill-purchase-gst").classList.add("display-block");
  document.getElementById("bill-purchase-gst").appendChild(purchaseBillTable.cloneNode(true));

  let purchaseTotalClone = createHtmlElement("div", "td-align-right section-middle", null, null, configs.totals.purchase);
  document.getElementById("bill-purchase-gst").appendChild(purchaseTotalClone);

  let netTotalSection = createHtmlElement("div", "section-close", null, null, null);
  netTotalSection.appendChild(createHtmlElement("div", "float-left custom-box", null, null, "GST Total"));
  netTotalSection.appendChild(createHtmlElement("div", "td-align-right custom-box", "purchase-gst-total", null, null));
  netTotalSection.appendChild(createHtmlElement("div", "float-left custom-box", null, null, "Net Total"));
  netTotalSection.appendChild(createHtmlElement("div", "td-align-right custom-box", null, null, configs.totals.total_bill));
  document.getElementById("bill-purchase-gst").appendChild(netTotalSection);
}

// net estimate totals
document.getElementById("sub-total").innerHTML = configs.totals.sub_total;
document.getElementById("discount").innerHTML = configs.totals.discount;
document.getElementById("total-bill").innerHTML = configs.totals.total_bill;
if (configs.totals.pending_as === "Due"
  && getFromDesiRupeeNumber(configs.totals.pending_amount) > 0) {
    document.getElementById("due-total").classList.add("display-block");
    document.getElementById("payment-due").innerHTML = configs.totals.pending_amount;
}

// gst totals
let cgstPercentage = 1.5
let sgstPercentage = 1.5
let sellingPrice = getFromDesiRupeeNumber(configs.totals.sales);
let discount = getFromDesiRupeeNumber(configs.totals.discount);
let gstTotals = calculateGSTAppliedTotals(sellingPrice, discount, cgstPercentage, sgstPercentage);

document.getElementById("sub-total-gst").innerHTML = configs.totals.sales;
document.getElementById("discount-gst").innerHTML = "₹ " + getDesiNumber(gstTotals.adjustedDiscount);
document.getElementById("cgst-header").innerHTML = "CGST @ " + cgstPercentage + "%";
document.getElementById("cgst-applied").innerHTML = "₹ " + getDesiNumber(gstTotals.cgstApplied);
document.getElementById("sgst-header").innerHTML = "SGST @ " + sgstPercentage + "%";
document.getElementById("sgst-applied").innerHTML = "₹ " + getDesiNumber(gstTotals.sgstApplied);
document.getElementById("total-bill-gst").innerHTML = "₹ " + getDesiNumber(gstTotals.totalPrice);
document.getElementById("purchase-gst-total").innerHTML = "₹ " + getDesiNumber(gstTotals.totalPrice);

// apply gst
function applyGST() {
  let gstEntries = document.getElementsByClassName("gst-invoice");
  for (let i=0; i<gstEntries.length; i++) {
    gstEntries[i].classList.remove("display-none")
  }
  let estimateEntries = document.getElementsByClassName("estimate-invoice");
  for (let i=0; i<estimateEntries.length; i++) {
    estimateEntries[i].classList.add("display-none")
  }
  document.getElementById("top-left-header").textContent = "GSTIN: 20AKXPD1609D1ZN";
  document.getElementById("top-center-header").textContent = "TAX INVOICE";
  document.getElementById("gst-button").textContent = "EST";
}

// apply estimate
function applyEstimate() {
  let gstEntries = document.getElementsByClassName("gst-invoice");
  for (let i=0; i<gstEntries.length; i++) {
    gstEntries[i].classList.add("display-none")
  }
  let estimateEntries = document.getElementsByClassName("estimate-invoice");
  for (let i=0; i<estimateEntries.length; i++) {
    estimateEntries[i].classList.remove("display-none")
  }
  document.getElementById("top-left-header").textContent = "";
  document.getElementById("top-center-header").textContent = "ESTIMATE ONLY";
  document.getElementById("gst-button").textContent = "GST";
}

// helper functions
function wrapTableData(element, lr) {
  let tableData = createHtmlElement("div", "table-data td-align-" + lr, null, null, null);
  tableData.appendChild(element);
  return tableData;
}

function compare(a, b) {
  if (a.Metal < b.Metal) {
    return -1;
  }

  if (a.Metal > b.Metal){
    return 1;
  }

  if (a.Weight_In_Gram < b.Weight_In_Gram) {
    return -1;
  }

  if (a.Weight_In_Gram > b.Weight_In_Gram) {
    return 1;
  }

  return 0;
}
