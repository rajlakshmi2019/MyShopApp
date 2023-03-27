const {ipcRenderer, remote} = require("electron");
const {createHtmlElement, addTableHeader, addTableData, getDesiNumber, getRupeeDesiNumber, getDesiDecimalNumber} = require("./../utils.js");
const Dao = remote.require("./Dao.js");

// bill entries and options
let configs = remote.getCurrentWindow().configs;

createTokenWindow();

function createTokenWindow() {
  // add print button
  let printButtonDiv = createHtmlElement("div", "no-print", "print-button-div", null, null);
  document.getElementById("bill-menu").appendChild(printButtonDiv);

  let printButton =
    createHtmlElement("button", null, "print-button", null, "Print");
  printButtonDiv.appendChild(printButton);
  printButton.addEventListener("click", () => {
    window.print();
  });

  // populate header
  document.getElementById("top-center-header").textContent = "TRANSACTION TOKEN";
  document.getElementById("top-right-header").textContent = "Mob: 9431156469, 8797858240";

  // general info
  document.getElementById("bill-no").textContent = configs.id;
  document.getElementById("billing-date").textContent = configs.bill_date;

  // sales table
  if (configs.transactions.length > 0) {
    configs.transactions = configs.transactions.sort(compare);

    let transactionsTable = createHtmlElement("table", "bill-table sales-table estimate-invoice print-friendly", "trans-table-default", null, null);
    document.getElementById("trans-details").appendChild(transactionsTable);

    addTableHeader(transactionsTable, ["Type", "Metal", "Weight", "Price"]);
    populateTransactionsTable(transactionsTable);
  }
}

function populateTransactionsTable(salesBillTable) {
  for (let i=0; i<configs.transactions.length; i++) {
    let entry = configs.transactions[i];
    let tableRow = [
      wrapTableData(document.createTextNode(entry.Type)),
      wrapTableData(document.createTextNode(entry.Metal ? entry.Metal : "-")),
      wrapTableData(document.createTextNode(entry.Weight_In_Gram ? getDesiDecimalNumber(entry.Weight_In_Gram) + " g" : "-")),
      wrapTableData(document.createTextNode(entry.Price ? getRupeeDesiNumber(entry.Price) : "-"))];
    let tr = addTableData(salesBillTable, tableRow);
    tr.className  = "section-end";
  }
}

// helper functions
function wrapTableData(element) {
  let tableData = createHtmlElement("div", "table-data td-align-center", null, null, null);
  tableData.appendChild(element);
  return tableData;
}

function compare(a, b) {
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
