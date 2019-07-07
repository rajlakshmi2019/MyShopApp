const {ipcRenderer, remote} = require("electron");
const {createHtmlElement, addTableHeader, addTableData} = require("./../utils.js");

// bill entries and options
let configs = remote.getCurrentWindow().configs;

// add print button
if (configs.printable == true) {
  let printButton = createHtmlElement("button", null, "print-button", null, "print");
  document.getElementById("bill-menu").appendChild(printButton);
  printButton.addEventListener("click", () => {
    window.print();
    ipcRenderer.send('save:pdf', configs);
  });
}

// general info
document.getElementById("bill-no").textContent = configs.id;
document.getElementById("billed-to").textContent = configs.name;
document.getElementById("billing-date").textContent = configs.bill_date;

// sales table in bill
if (configs.sales.length > 0) {
  configs.sales = configs.sales.sort(compare);

  let salesBillTable = createHtmlElement("table", "bill-table", null, null, null);
  document.getElementById("bill-sales").appendChild(salesBillTable);

  let thr = addTableHeader(
    salesBillTable, ["Item", "Qty", "Weight", "", ""]);
  thr.className = "sales-header";

  for (let i=0; i<configs.sales.length; i++) {
    let entry = configs.sales[i];
    for (let j=0; j<entry.items.length; j++) {
      let item = entry.items[j].name;
      let qty = entry.items[j].qty;

      var cl = "sales-row", weight = "", rate = "", making = "";
      if (j == entry.items.length - 1) {
        cl += " section-end";
        weight = parseFloat(Math.round(
          entry.Weight_In_Gram * 100) / 100).toFixed(2) + " g";
        rate = entry.Metal.charAt(0) + "- " + entry.Rate_Per_Gram + " /g";
        making = "M- " + (entry.Making_Per_Gram == null ?
          entry.Making + " /pc" : entry.Making_Per_Gram + " /g");
      }

      let tableRow = [
        wrapTableData(document.createTextNode(item), "left"),
        wrapTableData(document.createTextNode(qty), "right"),
        wrapTableData(document.createTextNode(weight), "right"),
        wrapTableData(document.createTextNode(rate), "right"),
        wrapTableData(document.createTextNode(making), "right")];

      let tr = addTableData(salesBillTable, tableRow);
      tr.className  = cl;
    }
  }

  // sales total
  let salesTotal = createHtmlElement("div", "td-align-right section-close", null, null, null);
  salesTotal.innerHTML = configs.totals.sales;
  document.getElementById("bill-sales").appendChild(salesTotal);
}

// purchase table
if (configs.purchase.length > 0) {
  configs.purchase = configs.purchase.sort(compare);

  let purchaseBillTable = createHtmlElement("table", "bill-table", null, null, null);
  document.getElementById("bill-purchase").appendChild(purchaseBillTable);

  let thr = addTableHeader(
    purchaseBillTable, ["Exchange", "Weight", "", ""]);
  thr.className = "purchase-header";

  for (let i=0; i<configs.purchase.length; i++) {
    let entry = configs.purchase[i];
    let tableRow = [
      wrapTableData(document.createTextNode(entry.Metal), "left"),
      wrapTableData(document.createTextNode(entry.Weight_In_Gram + " g"), "right"),
      wrapTableData(document.createTextNode(
        entry.Metal.charAt(0) + "- " + entry.Purchase_Rate_Per_Gram + " /g"), "right"),
      wrapTableData(document.createTextNode("@" + entry.Purity), "right")];

    let cl = "purchase-row";
    if (i == configs.purchase.length - 1) {
      cl+= " section-end";
    }

    let tr = addTableData(purchaseBillTable, tableRow);
    tr.className  = cl;
  }

  // purchase total
  let purchaseTotal = createHtmlElement("div", "td-align-right section-close", null, null, null);
  purchaseTotal.innerHTML = configs.totals.purchase;
  document.getElementById("bill-purchase").appendChild(purchaseTotal);
}

// net totals
document.getElementById("sub-total").innerHTML = configs.totals.sub_total;
document.getElementById("discount").innerHTML = configs.totals.discount;
document.getElementById("total-bill").innerHTML = configs.totals.total_bill;

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
