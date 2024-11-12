const {ipcRenderer, remote} = require("electron");
const {clearSelection, addCheckboxColumn, emptyTable, formatDate, getRupeeDesiNumber, getDesiDecimalNumber, createHtmlElement, generateTransactionId} = require("./../utils.js");
const Dao = remote.require("./Dao.js");
const windowFactory = remote.require("./windowFactory.js");

/* ESC key event handling */
/* NumKey - key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 109 || e.keyCode == 27) {
    window.close();
  }
}

/* ipc signal handlers */
ipcRenderer.on("update:date", (event, param) => {
  document.getElementById("date-input").value = param.Date;
  populateTransactionsTables();
});

let delButton = document.getElementById("delete-transactions-btn");
delButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  let transDate = document.getElementById("date-input").value;
  if (document.getElementsByClassName("transactions-color-checked").length > 0) {
    alert("This option deletes all transactions, please use `Reversal` for selected transactions!");
  } else if (confirm("Delete all transactions on " + transDate + "?")) {
    Dao.deleteTransactionsFile(transDate);
    populateTransactionsTables();
  }
});
delButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});

let reversalButton = document.getElementById("transaction-reversal-btn");
reversalButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  let transactionsToReverse = [];
  for (let transactionRow of document.getElementsByClassName("transactions-color-checked")) {
    let transaction = JSON.parse(transactionRow.querySelector(".transaction-json-hidden").textContent);
    if (transaction && transaction.Status === "ACTIVE" && !transaction.Type.endsWith("Reversal")) {
      transactionsToReverse.push(transaction);
    }
  }

  if (transactionsToReverse.length === 0) {
    alert("No transactions selected or Selection can't be reversed!!");
  } else {
    if (confirm("Reverse selected transactions?")) {
      let currentDate = new Date();
      Dao.addTransctionReversals(formatDate(currentDate), generateTransactionId(currentDate), transactionsToReverse);
      populateTransactionsTables();
    }
  }
});
reversalButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});

let manaulReversalButton = document.getElementById("manual-reversal-btn");
manaulReversalButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  windowFactory.createManualReversalForm(document.getElementById("date-input").value);
});
manaulReversalButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});

let carryOverButton = document.getElementById("carry-over-btn");
carryOverButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  windowFactory.createStockCarryoverForm(document.getElementById("date-input").value);
});
carryOverButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});

let addStockButton = document.getElementById("add-stock-btn");
addStockButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  windowFactory.createStockAdditionForm(document.getElementById("date-input").value);
});
addStockButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});


let summaryButton = document.getElementById("summary-btn");
summaryButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  Dao.createTransactionSummaryWindow(document.getElementById("date-input").value);
});
summaryButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});

/* Populate date*/
document.getElementById("date-input").addEventListener('change', function() {
  populateTransactionsTables();
});
document.getElementById("date-input").value = formatDate(new Date());
populateTransactionsTables();

function populateTransactionsTables() {
  let transactionsTable = document.getElementById("transactions-report-table");
  emptyTable(transactionsTable);

  let transDate = document.getElementById("date-input").value;
  let transactions = Dao.getTransactions(transDate);
  for (let transaction of transactions) {
    let tableDataElements = [];
    tableDataElements.push(document.createTextNode(transaction.Id));
    tableDataElements.push(document.createTextNode(transaction.Transaction_Id));
    tableDataElements.push(document.createTextNode(transaction.Date));
    tableDataElements.push(document.createTextNode(transaction.Type));
    tableDataElements.push(document.createTextNode(transaction.Metal));
    tableDataElements.push(document.createTextNode(transaction.Weight_In_Gram ? getDesiDecimalNumber(transaction.Weight_In_Gram) + " g" : ""));

    let ratePerGram = transaction.Rate_Per_Gram ? getRupeeDesiNumber(transaction.Rate_Per_Gram) + " /g" :
      (transaction.Purchase_Rate_Per_Gram ? getRupeeDesiNumber(transaction.Purchase_Rate_Per_Gram) + " /g" : "");
    tableDataElements.push(document.createTextNode(ratePerGram));
    
    let making = transaction.Making_Percentage ? transaction.Making_Percentage + " %" :
      (transaction.Making_Per_Gram ? getRupeeDesiNumber(transaction.Making_Per_Gram) + " /g" :
      (isNaN(Number(transaction.Making)) ? "" : (transaction.Making ? getRupeeDesiNumber(transaction.Making) : "")));
    tableDataElements.push(document.createTextNode(making));
    

    // hidden transaction json
    let priceBoxDiv = document.createElement("div");
    let priceTextDiv = createHtmlElement("div", "transaction-price", null, transaction.Price ? getRupeeDesiNumber(transaction.Price) : "", null);
    priceBoxDiv.appendChild(priceTextDiv);
    let priceHiddenDiv = createHtmlElement("div", "transaction-json-hidden display-none", null, JSON.stringify(transaction), null);
    priceBoxDiv.appendChild(priceHiddenDiv);
    tableDataElements.push(priceBoxDiv);

    tableDataElements.push(document.createTextNode(transaction.Ref));
    tableDataElements.push(document.createTextNode(transaction.Status));
    tableDataElements.push(document.createTextNode(transaction.Status === "REVERSED" ? transaction.Modified_On : ""));

    addTableDataWithCheckbox(transactionsTable, tableDataElements,
      transaction.Status === "REVERSED" ? "reversed" : (transaction.Type.endsWith("Reversal") ? "reversal" : transaction.Type.toLowerCase().split(" ")[0]),
      () => {});
  }

  // populate summary table
  let transactionSummary = Dao.getTransactionSummary(transDate);
  document.getElementById("gold-stock").textContent = getDesiDecimalNumber(transactionSummary.Gold_Stock_Net) + " g";
  document.getElementById("gold-sold").textContent = getDesiDecimalNumber(transactionSummary.Gold_Sales) + " g";
  document.getElementById("old-gold-purchased").textContent = getDesiDecimalNumber(transactionSummary.Gold_Old_Purchase) + " g";
  document.getElementById("silver-stock").textContent = getDesiDecimalNumber(transactionSummary.Silver_Stock_Net) + " g";
  document.getElementById("silver-sold").textContent = getDesiDecimalNumber(transactionSummary.Silver_Sales) + " g";
  document.getElementById("old-silver-purchased").textContent = getDesiDecimalNumber(transactionSummary.Silver_Old_Purchase) + " g";
  document.getElementById("cash-stock").textContent = getRupeeDesiNumber(transactionSummary.Cash_Stock_Net);
  document.getElementById("cash-sold").textContent = getRupeeDesiNumber(transactionSummary.Cash_Sales);
  document.getElementById("cash-purchased").textContent = getRupeeDesiNumber(transactionSummary.Cash_Purchase);
  document.getElementById("cash-additional").textContent = getRupeeDesiNumber(transactionSummary.Cash_Additional_Charges);
  document.getElementById("cash-discount").textContent = getRupeeDesiNumber(transactionSummary.Cash_Discount);
  document.getElementById("cash-due").textContent = getRupeeDesiNumber(transactionSummary.Cash_Due);
}

function addTableDataWithCheckbox(table, tableDataElements, color, checkboxCallback) {
  let trElement = document.createElement("tr");
  trElement.className = "transactions-report-data";
  trElement.classList.add("transactions-color-" + color);
  table.appendChild(trElement);

  //Add column data
  addCheckboxColumn(trElement, "checkbox-row",
  () => {
    trElement.classList.add("transactions-color-checked");
    checkboxCallback();
  },
  () => {
    trElement.classList.remove("transactions-color-checked");
    checkboxCallback();
  }, false);
  addColumnData(trElement, tableDataElements);

  return trElement;
}

function addColumnData(trElement, tableDataElements) {
  for (let i=0; i<tableDataElements.length; i++) {
    let tdElement = document.createElement("td");
    tdElement.className = "align-center transactions-cell";
    tdElement.appendChild(tableDataElements[i]);
    trElement.appendChild(tdElement);
  }
}