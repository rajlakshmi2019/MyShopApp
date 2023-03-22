const {ipcRenderer, remote} = require("electron");
const {createHtmlElement, addTableHeader, addTableData, getDesiNumber, getRupeeDesiNumber,
  getRupeeDesiDecimalNumber, getFromDesiRupeeNumber, isMobileNumber} = require("./../utils.js");
const {calculateGSTAppliedTotals} = require("./../ShopCalculator.js");
const Dao = remote.require("./Dao.js");

// bill entries and options
let configs = remote.getCurrentWindow().configs;

createBillWindow();

function createBillWindow() {
  // add print button
  let printButtonDiv = createHtmlElement("div", "no-print", "print-button-div", null, null);
  document.getElementById("bill-menu").appendChild(printButtonDiv);

  let printButton =
    createHtmlElement("button", null, "print-button", null, configs.type === "GST" ? "Expand" : "Print");
  printButtonDiv.appendChild(printButton);
  printButton.addEventListener("click", () => {
    if (printButton.innerHTML === "Expand") {
      expandPagesGST();
      printButton.innerHTML = "Print";
    } else if (printButton.innerHTML === "Print") {
      window.print();
    }
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

  // sales table
  if (configs.sales.length > 0 || configs.additional > 0) {
    configs.sales = configs.sales.sort(compare);

    let salesBillTable = createHtmlElement("table", "bill-table sales-table estimate-invoice print-friendly", "sales-table-default", null, null);
    document.getElementById("bill-sales").appendChild(salesBillTable);
    let salesBillTableLessGST =
      createHtmlElement("table", "bill-table sales-table estimate-invoice display-none print-friendly", "sales-table-less-gst", null, null);
    document.getElementById("bill-sales").appendChild(salesBillTableLessGST);
    let salesBillTableLessGSTWithHSN =
      createHtmlElement("table", "bill-table sales-table gst-invoice display-none print-friendly", "sales-table-with-hsn", null, null);
    document.getElementById("bill-sales").appendChild(salesBillTableLessGSTWithHSN);

    let thr = addTableHeader(
      salesBillTable, ["Item", "Qty", "Weight", "Breakup", "Price"]);
    thr.className = "sales-header";
    let thrLessGST = addTableHeader(
      salesBillTableLessGST, ["Item", "Qty", "Weight", "Breakup", "Price"]);
    thrLessGST.className = "sales-header";
    let thrLessGSTWithHSN = addTableHeader(
      salesBillTableLessGSTWithHSN, ["Item", "HSN/SAC", "Qty", "Weight", "Breakup", "Price"]);
    thrLessGSTWithHSN.className = "sales-header-with-hsn";
    populateSalesBillTable(salesBillTable, false, false);
    populateSalesBillTable(salesBillTableLessGST, true, false);
    populateSalesBillTable(salesBillTableLessGSTWithHSN, true, true);

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
  if (configs.totals.pending_amount != null && getFromDesiRupeeNumber(configs.totals.pending_amount) > 0) {
      document.getElementById("due-total").classList.add("display-block");
      document.getElementById("payment-due").innerHTML = configs.totals.pending_amount;
  }

  // gst invoice generation
  if (configs.type === "GST") {
    applyGST(1.5, 1.5);
  }
}

function populateSalesBillTable(salesBillTable, lessGST, withHSN) {
  for (let i=0; i<configs.sales.length; i++) {
    let entry = configs.sales[i];
    entry.items = entry.items.sort(compare);
    for (let j=0; j<entry.items.length; j++) {
      let item = entry.items[j].Item;
      if (entry.items[j].Item.startsWith("Fancy") || entry.items[j].Item.startsWith("Dulhan")) {
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
          var making = entry.Making_Percentage == null ? (entry.Making_Per_Gram == null ?
            entry.Making + "/pc" : entry.Making_Per_Gram + "/g") : entry.Making_Percentage + "%";
          breakup = rate + " + " + making;
        }
      }

      let tableRow = [
        wrapTableData(document.createTextNode(item), "left"),
        wrapTableData(document.createTextNode(qty), "right"),
        wrapTableData(document.createTextNode(weight), "right"),
        wrapTableData(document.createTextNode(breakup), "right"),
        wrapTableData(document.createTextNode(price), "right")];

      if (withHSN) {
        tableRow.splice(1, 0, wrapTableData(document.createTextNode("7113"), "right"));
        cl = cl.replace("sales-row", "sales-row-with-hsn");
      }

      let tr = addTableData(salesBillTable, tableRow);
      tr.className  = cl;
    }
  }

  // additional charge
  if (configs.additional > 0) {
    let tableRow = [
      wrapTableData(document.createTextNode("Other Accessories"), "left"),
      wrapTableData(document.createTextNode("1"), "right"),
      wrapTableData(document.createTextNode(""), "right"),
      wrapTableData(document.createTextNode(""), "right"),
      wrapTableData(document.createTextNode("₹ " + configs.additional), "right")];

    let clEnd = "sales-row section-end";
    if (withHSN) {
      clEnd = "sales-row-with-hsn section-end";
      tableRow.splice(1, 0, wrapTableData(document.createTextNode("7113"), "right"));
    }

    let tr = addTableData(salesBillTable, tableRow);
    tr.className  = clEnd;
  }
}

// apply gst
function applyGST(cgstRate, sgstRate) {
  document.getElementById("gst-rate-flag").classList.add("display-none");

  let gstEntries = document.getElementsByClassName("gst-invoice");
  for (let i=0; i<gstEntries.length; i++) {
    gstEntries[i].classList.remove("display-none");
  }
  if (configs.purchase.length == 0) {
    document.getElementById("bill-purchase-gst").classList.add("display-none");
  }

  let estimateEntries = document.getElementsByClassName("estimate-invoice");
  for (let i=0; i<estimateEntries.length; i++) {
    estimateEntries[i].classList.add("display-none");
  }
  document.getElementById("top-left-header").textContent = "GSTIN: 20AKXPD1609D1ZN";
  document.getElementById("top-center-header").textContent = "TAX INVOICE";
  document.getElementById("gst-button").classList.add("display-none");
  document.getElementById("bill-no-text").textContent = "INVOICE NO.";
  document.getElementById("bill-no").textContent = configs.gstInvoiceNumber;
  document.getElementById("billing-date").textContent = configs.gstInvoiceDate;
  document.getElementById("billing-name").textContent = configs.gstName;
  document.getElementById("billing-address").textContent = configs.gstAddress;
  document.getElementById("billing-phone-no").textContent = configs.gstPhoneNumber;
  if (configs.gstin !== "") {
    document.getElementById("billing-gstin").textContent = configs.gstin;
    document.getElementById("billing-gstin-div").classList.remove("display-none");
  }

  document.getElementById("sales-table-total").innerHTML = configs.totals.sales_less_gst;
  document.getElementById("cgst-header").innerHTML = "CGST @ " + cgstRate + "%";
  document.getElementById("sgst-header").innerHTML = "SGST @ " + sgstRate + "%";
  document.getElementById("sub-total-gst").innerHTML = configs.totals.sales_less_gst + ".00";
  document.getElementById("discount-gst").innerHTML = getRupeeDesiDecimalNumber(configs.gstTotals.adjustedDiscount);
  document.getElementById("taxed-amount").innerHTML = getRupeeDesiDecimalNumber(configs.gstTotals.taxedAmount);
  document.getElementById("cgst-applied").innerHTML = getRupeeDesiDecimalNumber(configs.gstTotals.cgstApplied);
  document.getElementById("sgst-applied").innerHTML = getRupeeDesiDecimalNumber(configs.gstTotals.sgstApplied);
  document.getElementById("round-off").innerHTML = getRupeeDesiDecimalNumber(configs.gstTotals.roundOff);
  document.getElementById("total-bill-gst").innerHTML = getRupeeDesiDecimalNumber(configs.gstTotals.totalAmount);

  // Create GST bill copy
  document.getElementById("bill-copy-page-gst").appendChild(document.getElementById("bill-main-page").cloneNode(true));

  // Create post GST exchange summary
  if (configs.purchase.length > 0) {
    purchaseTotal = Math.abs(getFromDesiRupeeNumber(configs.totals.purchase));
    netTotal = configs.gstTotals.totalAmount - purchaseTotal;
    document.getElementById("purchase-gst-total").innerHTML = getRupeeDesiNumber(configs.gstTotals.totalAmount);
    document.getElementById("purchase-gst-net-total").innerHTML = getRupeeDesiNumber(netTotal);
  }
}

function expandPagesGST() {
  document.getElementById("bill-copy-page-gst").classList.add("display-block");
  document.getElementById("bill-purchase-gst").classList.add("display-block");
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
