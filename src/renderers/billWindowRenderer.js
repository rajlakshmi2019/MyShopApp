const {ipcRenderer, remote} = require("electron");
const {createHtmlElement, addTableHeader, addTableData, getDesiNumber,
  getFromDesiRupeeNumber, isMobileNumber} = require("./../utils.js");
const {calculateGSTAppliedTotals} = require("./../ShopCalculator.js");
const Dao = remote.require("./Dao.js");

// bill entries and options
let configs = remote.getCurrentWindow().configs;

createBillWindow();

function createBillWindow() {
  // add print button
  let printButtonDiv = createHtmlElement("div", "no-print", "print-button-div", null, null);
  document.getElementById("bill-menu").appendChild(printButtonDiv);

  let printButton = createHtmlElement("button", null, "print-button", null, "Print");
  printButtonDiv.appendChild(printButton);
  printButton.addEventListener("click", () => {
    window.print();
  });

  let gstButton = createHtmlElement("button", null, "gst-button", null, "EST");
  printButtonDiv.appendChild(gstButton);
  gstButton.addEventListener("click", () => {
    if (document.getElementById("gst-button").textContent === "GST") {
      applyEstimateGST();
    } else if (document.getElementById("gst-button").textContent === "EST") {
      applyEstimate();
    }
  });

  // populate header
  document.getElementById("top-center-header").textContent = "ESTIMATE ONLY";
  document.getElementById("top-right-header").textContent = "Mob: 9431156469, 8797858240";

  // general info
  document.getElementById("bill-no").textContent = configs.id;
  document.getElementById("billing-date").textContent = configs.bill_date;
  if (isMobileNumber(configs.tabName)) {
    document.getElementById("billing-phone-no").textContent = configs.tabName;
  }

  // sales table in bill
  if (configs.sales.length > 0 || configs.additional > 0) {
    configs.sales = configs.sales.sort(compare);

    let salesBillTable = createHtmlElement("table", "bill-table sales-table print-friendly", "sales-table-default", null, null);
    document.getElementById("bill-sales").appendChild(salesBillTable);
    let salesBillTableLessGST =
      createHtmlElement("table", "bill-table sales-table display-none print-friendly", "sales-table-less-gst", null, null);
    document.getElementById("bill-sales").appendChild(salesBillTableLessGST);

    let thr = addTableHeader(
      salesBillTable, ["Item", "Qty", "Weight", "Breakup", "Price"]);
    thr.className = "sales-header";
    let thrLessGST = addTableHeader(
      salesBillTableLessGST, ["Item", "Qty", "Weight", "Breakup", "Price"]);
    thrLessGST.className = "sales-header";
    populateSalesBillTable(salesBillTable, false);
    populateSalesBillTable(salesBillTableLessGST, true);

    // additional charge for Munga/Moti/Mala/Others
    if (configs.additional > 0) {
      let tableRow = [
        wrapTableData(document.createTextNode("Other Accessories"), "left"),
        wrapTableData(document.createTextNode(""), "right"),
        wrapTableData(document.createTextNode(""), "right"),
        wrapTableData(document.createTextNode(""), "right"),
        wrapTableData(document.createTextNode("₹ " + configs.additional), "right")];

      let tr = addTableData(salesBillTable, tableRow);
      tr.className  = "sales-row section-end";
    }

    // sales total
    let salesTotal = createHtmlElement("div", "td-align-right section-close", "sales-table-total", null, configs.totals.sales);
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
    netTotalSection.appendChild(createHtmlElement("div", "td-align-right custom-box", "purchase-gst-net-total", null, null));
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
  if (configs.purchase.length > 0) {
    purchaseTotal = getFromDesiRupeeNumber(configs.totals.purchase.substring(2));
    netTotal = gstTotals.totalPrice - purchaseTotal;
    document.getElementById("purchase-gst-net-total").innerHTML =
      (netTotal < 0 ? "- ₹ " : "₹ ") + getDesiNumber(Math.abs(netTotal));
  }
}

function populateSalesBillTable(salesBillTable, lessGST) {
  for (let i=0; i<configs.sales.length; i++) {
    let entry = configs.sales[i];
    entry.items = entry.items.sort(compare);
    for (let j=0; j<entry.items.length; j++) {
      let item = entry.items[j].Item;
      if (entry.items[j].Item.startsWith("Fancy") || entry.items[j].Item.startsWith("Dulhan")) {
        console.log(["Silver", entry.items[j].Item].toString());
        item += " " + (Dao.getMappedItem(["Silver", entry.items[j].Item].toString()).APPLIED * 1000);
      }

      let qty = entry.items[j].Quantity;
      let weight = entry.items[j].Metal === "Accessories" ? "" :
        parseFloat(Math.round(entry.items[j].Weight_In_Gram * 100) / 100).toFixed(2) + "g";
      let price = lessGST ? "₹ " + getDesiNumber(entry.items[j].Price_Less_GST) : "₹ " + getDesiNumber(entry.items[j].Price);

      var cl = "sales-row", breakup = "";
      if (j == entry.items.length - 1) {
        cl += " section-end";
        if (entry.items[j].Metal === "Accessories") {
          breakup = ""
        } else {
          var rate = entry.Metal.charAt(0) + " " + entry.Rate_Per_Gram + "/g";
          var making = (entry.Making_Per_Gram == null ?
            entry.Making + "/pc" : entry.Making_Per_Gram + "/g");
          breakup = rate + " + " + making;
        }
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
}

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
  document.getElementById("bill-no-text").textContent = "INVOICE NO.";
  document.getElementById("bill-no").textContent = "......................";
}

function applyEstimateGST() {
  applyEstimateFormat();
  document.getElementById("gst-button").textContent = "EST";
  document.getElementById("sales-table-less-gst").classList.add("display-none");
  document.getElementById("sales-table-default").classList.remove("display-none");
  document.getElementById("gst-rate-flag").classList.remove("display-none");
  document.getElementById("sales-table-total").innerHTML = configs.totals.sales;
  document.getElementById("sub-total").innerHTML = configs.totals.sub_total;
  document.getElementById("discount").innerHTML = configs.totals.discount;
  document.getElementById("total-bill").innerHTML = configs.totals.total_bill;
}

// apply estimate
function applyEstimate() {
  applyEstimateFormat();
  document.getElementById("gst-button").textContent = "GST";
  document.getElementById("sales-table-default").classList.add("display-none");
  document.getElementById("sales-table-less-gst").classList.remove("display-none");
  document.getElementById("gst-rate-flag").classList.add("display-none");
  document.getElementById("sales-table-total").innerHTML = configs.totals.sales_less_gst;
  document.getElementById("sub-total").innerHTML = configs.totals.sub_total_less_gst;
  document.getElementById("discount").innerHTML = configs.totals.discount_less_gst;
  document.getElementById("total-bill").innerHTML = configs.totals.total_bill_less_gst;
}

function applyEstimateFormat() {
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
  document.getElementById("bill-no-text").textContent = "ESTIMATE NO.";
  document.getElementById("bill-no").textContent = configs.id;
}

// helper functions
function wrapTableData(element, lr) {
  let tableData = createHtmlElement("div", "table-data td-align-" + lr, null, null, null);
  tableData.appendChild(element);
  return tableData;
}

function compare(a, b) {
  if (a.Metal < b.Metal && a.Metal === "Accessories") {
    return 1;
  }

  if (a.Metal > b.Metal && b.Metal === "Accessories") {
    return -1;
  }

  if (a.Metal < b.Metal) {
    return -1;
  }

  if (a.Metal > b.Metal) {
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
