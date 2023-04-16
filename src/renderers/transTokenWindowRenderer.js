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
  if (configs.transactions && configs.transactions.length > 0) {
    document.getElementById("trans-details-wrapper").classList.remove("display-none");
    configs.transactions = configs.transactions.sort(compare);

    let transactionsTable = createHtmlElement("table", "bill-table sales-table estimate-invoice print-friendly", "trans-table-default", null, null);
    document.getElementById("trans-details").appendChild(transactionsTable);

    addTableHeader(transactionsTable, ["Type", "Metal", "Weight", "Amount", "Ref"]);
    populateTransactionsTable(transactionsTable);
  }

  if (configs.summary) {
    document.getElementById("trans-summary-wrapper").classList.remove("display-none");
    document.getElementById("opening-token-div").textContent = configs.summary.Opening_Token_No;
    document.getElementById("closing-token-div").textContent = configs.summary.Closing_Token_No;

    let summaryTable = createHtmlElement("table", "bill-table sales-table estimate-invoice print-friendly", "summary-table-default", null, null);
    document.getElementById("trans-summary").appendChild(summaryTable);

    addTableHeader(summaryTable, ["Type", "Closing Stock", "Sales", "Purchase (Old)"]);
    populateSummaryTable(configs.summary, summaryTable);
  }
}

function populateTransactionsTable(salesBillTable) {
  for (let i=0; i<configs.transactions.length; i++) {
    let entry = configs.transactions[i];
    let tableRow = [
      wrapTableData(document.createTextNode(entry.Type)),
      wrapTableData(document.createTextNode(entry.Metal ? entry.Metal : "-")),
      wrapTableData(document.createTextNode(entry.Weight_In_Gram ? getDesiDecimalNumber(entry.Weight_In_Gram) + " g" : "-")),
      wrapTableData(document.createTextNode(entry.Price ? getRupeeDesiNumber(entry.Price) : "-")),
      wrapTableData(document.createTextNode(entry.Ref ? entry.Ref : "-"))];
    let tr = addTableData(salesBillTable, tableRow);
    tr.className  = "section-end";
  }
}

function populateSummaryTable(summary, summaryTable) {
  let tableRows = [
    [
      wrapTableData(document.createTextNode("Gold")),
      wrapTableData(document.createTextNode(summary.Gold_Stock_Net ? getDesiDecimalNumber(summary.Gold_Stock_Net) + " g" : "-")),
      wrapTableData(document.createTextNode(summary.Gold_Sales ? getDesiDecimalNumber(summary.Gold_Sales) + " g" : "-")),
      wrapTableData(document.createTextNode(summary.Gold_Old_Purchase ? getDesiDecimalNumber(summary.Gold_Old_Purchase) + " g" : "-"))
    ],
    [
      wrapTableData(document.createTextNode("Silver")),
      wrapTableData(document.createTextNode(summary.Silver_Stock_Net ? getDesiDecimalNumber(summary.Silver_Stock_Net) + " g" : "-")),
      wrapTableData(document.createTextNode(summary.Silver_Sales ? getDesiDecimalNumber(summary.Silver_Sales) + " g" : "-")),
      wrapTableData(document.createTextNode(summary.Silver_Old_Purchase ? getDesiDecimalNumber(summary.Silver_Old_Purchase) + " g" : "-"))
    ],
    [
      wrapTableData(document.createTextNode("Cash")),
      wrapTableData(document.createTextNode(summary.Cash_Stock_Net ? getRupeeDesiNumber(summary.Cash_Stock_Net) + " g" : "-")),
      wrapTableData(document.createTextNode(summary.Cash_Sales ? getRupeeDesiNumber(summary.Cash_Sales) + " g" : "-")),
      wrapTableData(document.createTextNode(summary.Cash_Purchase ? getRupeeDesiNumber(summary.Cash_Purchase) + " g" : "-"))
    ]
  ];

  if (summary.Cash_Additional_Charges && summary.Cash_Additional_Charges > 0) {
    tableRows.push(
      [
        wrapTableData(document.createTextNode("Cash Additional Charges")),
        wrapTableData(document.createTextNode(getRupeeDesiNumber(summary.Cash_Additional_Charges))),
        wrapTableData(document.createTextNode("-")),
        wrapTableData(document.createTextNode("-"))
      ]
    );
  }

  if (summary.Cash_Discount && summary.Cash_Discount > 0) {
    tableRows.push(
      [
        wrapTableData(document.createTextNode("Cash Discount")),
        wrapTableData(document.createTextNode(getRupeeDesiNumber(summary.Cash_Discount))),
        wrapTableData(document.createTextNode("-")),
        wrapTableData(document.createTextNode("-"))
      ]
    );
  }

  if (summary.Cash_Due && summary.Cash_Due > 0) {
    tableRows.push(
      [
        wrapTableData(document.createTextNode("Cash Due")),
        wrapTableData(document.createTextNode(getRupeeDesiNumber(summary.Cash_Due))),
        wrapTableData(document.createTextNode("-")),
        wrapTableData(document.createTextNode("-"))
      ]
    );
  }

  for (let tableRow of tableRows) {
    let tr = addTableData(summaryTable, tableRow);
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
