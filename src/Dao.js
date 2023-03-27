const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const readline = require('readline');
const url = require('url');
const path = require('path');
const csv = require('csvtojson');
const AppConfigs = require('./AppConfigs.js');
const {app, BrowserWindow} = require('electron');
const {formatDate, formatDateReverse} = require("./utils.js");

let appConfigs = null, mainWindow = null;

let loadAppConfigs = async function() {
  let metalRateRecords = await csv().fromFile(process.env.BASE_CONFIG_DIR + 'metal_rate.csv');
  let gradesMakingRateDiffRecords = await csv().fromFile(process.env.BASE_CONFIG_DIR + 'grades_making_rate_diff.csv');
  let itemsConfigRecords = await csv().fromFile(process.env.BASE_CONFIG_DIR + 'items_config.csv');

  appConfigs = new AppConfigs(
    metalRateRecords, gradesMakingRateDiffRecords, itemsConfigRecords);
}

let setMainWindow = function(windowToSet) {
  mainWindow = windowToSet;
}

let getGSTSerialNumber = function(filedir) {
  try {
    return parseInt(fs.readFileSync(process.env.BASE_DATA_DIR + filedir + 'gst_serial_number.csv')) + 1;
  } catch(e) {
    console.log(e);
    return 1;
  }
}

let persistGSTRecord = function(gstBillParams, filedir, filename) {
  let filepath = process.env.BASE_DATA_DIR + filedir;

  // check if file exists
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath);
  }

  if (!fs.existsSync(filepath + filename)) {
    let fileHeader = 'Invoice No,Date,Name,Address,Phone No,Taxable Value,CGST,SGST,Total GST,Round Off,Total Bill,Gold Wt,Silver Wt';
    fs.appendFileSync(filepath + filename, fileHeader);
  }

  // write to file
  let gstRecord = '' + gstBillParams.gstInvoiceNumber + ',' +
    gstBillParams.gstInvoiceDate + ',' + gstBillParams.gstName.replace(/,/g, ':') + ',' +
    gstBillParams.gstAddress.replace(/,/g, ':') + ',' + gstBillParams.gstPhoneNumber + ',' +
    gstBillParams.gstTotals.taxedAmount + ',' + gstBillParams.gstTotals.cgstApplied + ',' +
    gstBillParams.gstTotals.sgstApplied + ',' + gstBillParams.gstTotals.gstApplied + ',' +
    gstBillParams.gstTotals.roundOff + ',' + gstBillParams.gstTotals.totalAmount + ',' +
    gstBillParams.weight_totals.gold_sales_in_gram + ',' + gstBillParams.weight_totals.silver_sales_in_gram;

  addGSTRecordToFile(filepath + filename, Number(gstBillParams.gstInvoiceNumber), gstRecord);

  // Update gst serial number
  if (Number(gstBillParams.gstInvoiceNumber) >= gstBillParams.gstSerialNumber) {
    fs.writeFileSync(filepath + 'gst_serial_number.csv', gstBillParams.gstInvoiceNumber);
  }
}

let savePDF = function(pdf, filedir, filename) {
  let filepath = process.env.BASE_DATA_DIR + filedir;

  // check if file exists
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath);
  }

  // write to file
  fs.writeFile(filepath + filename, pdf, (error) => {
    if (error) console.log(error.message);
  });
}

let getTodaysRate = function() {
  return appConfigs.metalRate;
}

let getTodaysGoldRate = function() {
  return appConfigs.metalRate.Gold;
}

let getTodaysSilverRate = function() {
  return appConfigs.metalRate.Silver;
}

let getPurchaseRateDiff = function() {
  return appConfigs.purchaseRateDiff;
}

let getGoldPurchseRateDiff = function() {
  return appConfigs.purchaseRateDiff.Gold;
}

let getSilverPurchseRateDiff = function() {
  return appConfigs.purchaseRateDiff.Silver;
}

let getPercentageMaking = function() {
  return appConfigs.percentageMaking;
}

let getGradesList = function() {
  return appConfigs.grades;
}

let getGradeMakingRateDiff = function() {
  return appConfigs.gradeMakingRateDiff;
}

let getGoldItemTypes = function() {
  return appConfigs.itemTypes.Gold;
}

let getSilverItemTypes = function() {
  return appConfigs.itemTypes.Silver;
}

let getAccessoriesItemTypes = function() {
  return appConfigs.itemTypes.Accessories;
}

let getMappedItem = function(itemKey) {
  return appConfigs.itemConfigs.get(itemKey);
}

let getSpecialDiscountOffer = function() {
  return {"Gold": {"metalRate": {"isFlatDiscount": true, "value": 0}, "makingCharge": {"isFlatDiscount": true, "value": 0}},
    "Silver": {"metalRate": {"isFlatDiscount": true, "value": 0}, "makingCharge": {"isFlatDiscount": true, "value": 0}}};
}

let updateMetalRate = async function(metalRate, purchaseRateDiff) {
  let making = appConfigs.percentageMaking;
  let metalRateContent = "METAL,RATE,DIFF,PERCENTAGE_MAKING,PERCENTAGE_MAKING_DIFF,PERCENTAGE_MAKING_ENABLED\n" +
    "Gold," + metalRate.Gold + "," + purchaseRateDiff.Gold + "," + making.Gold.RATE + "," + making.Gold.DIFF_UNIT + "," + (making.Gold.ENABLED ? "TRUE" : "FALSE") + "\n" +
    "Silver," + metalRate.Silver + "," + purchaseRateDiff.Silver + "," + making.Silver.RATE + "," + making.Silver.DIFF_UNIT + "," + (making.Silver.ENABLED ? "TRUE" : "FALSE") + "\n";
    // write to file
    fs.writeFileSync(process.env.BASE_CONFIG_DIR + 'metal_rate.csv', metalRateContent);
    loadAppConfigs();
}

let saveMobileNo = async function(mobileNo) {
  fs.appendFileSync(process.env.BASE_DATA_DIR + 'wa.csv', mobileNo + "\n");
}

let getDirectoryContents = function(dirname) {
  return fs.readdirSync(process.env.BASE_DATA_DIR + dirname);
}

let getGSTReportRecords = async function(gstReportFile) {
  return await csv().fromFile(process.env.BASE_DATA_DIR + gstReportFile);
}

let getTransactions = function(transactionDate) {
  let transactions = []
  let headers = ("" + process.env.TRANSACTIONS_FILE_HEADER).split(',');
  let transactionEnteries = readTransactionEntries(transactionDate);
  if (transactionEnteries) {
    let idr = 0;
    for (let transactionEntry of transactionEnteries.split('\n')) {
      if (transactionEntry) {
        let itr = 0;
        let transaction = {}
        for (let value of transactionEntry.split(',')) {
          if (itr < headers.length) {
            transaction[headers[itr++]] = (!value || isNaN(Number(value))) ? value : Number(value);
          }
        }
        transaction['Id'] = idr++;
        transaction['Status'] = "ACTIVE";
        transaction['Created_On'] = transaction['Date'];
        transaction['Modified_On'] = transaction['Date'];
        if (transaction['Type'] === "Reversal Marker") {
          transactions[transaction['Ref']]['Status'] = "REVERSED";
          transactions[transaction['Ref']]['Modified_On'] = transaction['Date'];
        }

        transactions.push(transaction);
      }
    }
  }

  return transactions.filter((trans) => trans['Type'] !== "Reversal Marker");
}

let getTransactionSummary = function(transactionDate) {
  let summary = {
    "Gold_Stock": 0,
    "Gold_Sales": 0,
    "Gold_Old_Purchase": 0,

    "Silver_Stock": 0,
    "Silver_Sales": 0,
    "Silver_Old_Purchase": 0,
    
    "Cash_Stock": 0,
    "Cash_Sales": 0,
    "Cash_Purchase": 0,
    "Cash_Additional_Charges": 0,
    "Cash_Discount": 0,
    "Cash_Due": 0
  }

  let transactions = getTransactions(transactionDate);
  for (let transaction of transactions) {
    let sign = transaction['Type'].endsWith("Reversal") ? -1 : 1;
    switch(transaction['Type']) {
      case "Sales":
      case "Sales Reversal":
      case "Manual Sales Reversal":
        if (transaction['Metal'] === "Gold") {
          summary['Gold_Sales'] += sign * Number(transaction['Weight_In_Gram']);
        } else if (transaction['Metal'] === "Silver") {
          summary['Silver_Sales'] += sign * Number(transaction['Weight_In_Gram']);
        }
        summary['Cash_Sales'] += sign * Number(transaction['Price']);
        break;
      
      case "Purchase":
      case "Purchase Reversal":
        if (transaction['Metal'] === "Gold") {
          summary['Gold_Old_Purchase'] += sign * Number(transaction['Weight_In_Gram']);
        } else if (transaction['Metal'] === "Silver") {
          summary['Silver_Old_Purchase'] += sign * Number(transaction['Weight_In_Gram']);
        }
        summary['Cash_Purchase'] += sign * Number(transaction['Price']);
        break;
      
      case "Additional Charges":
      case "Additional Charges Reversal":
        summary['Cash_Additional_Charges'] += sign * Number(transaction['Price']);
        break;
      
      case "Discount":
      case "Discount Reversal":
        summary['Cash_Discount'] += sign * Number(transaction['Price']);
        break;

      case "Due Amount":
      case "Due Amount Reversal":
        summary['Cash_Due'] += sign * Number(transaction['Price']);
        break;

      case "Stock Addition":
      case "Stock Addition Reversal":
      case "Stock Carryover":
      case "Stock Carryover Reversal":
        if (transaction['Metal'] === "Gold") {
          summary['Gold_Stock'] += sign * Number(transaction['Weight_In_Gram']);
        } else if (transaction['Metal'] === "Silver") {
          summary['Silver_Stock'] += sign * Number(transaction['Weight_In_Gram']);
        }
        break;

      case "Cash Addition":
      case "Cash Addition Reversal":
      case "Cash Carryover":
      case "Cash Carryover Reversal":
        summary['Cash_Stock'] += sign * Number(transaction['Price']);
    }
  }

  summary["Gold_Stock_Net"] = summary["Gold_Stock"] - summary["Gold_Sales"];
  summary["Silver_Stock_Net"] = summary["Silver_Stock"] - summary["Silver_Sales"];
  summary["Cash_Stock_Net"] = summary["Cash_Stock"] + summary["Cash_Sales"] + summary["Cash_Additional_Charges"]
    - summary["Cash_Purchase"] - summary["Cash_Discount"] - summary["Cash_Due"];
  return summary;
}

let readTransactionEntries = function(transactionDate) {
  let transactionsFileName = process.env.BASE_DATA_DIR + transactionDate;
  if (fs.existsSync(transactionsFileName)) {
    // get aes256 encryption key from password
    let aes256Key = crypto.createHash('sha256').update("gV7jqM6twQ").digest();
    return decryptAES256(aes256Key, getFirstBlock(transactionsFileName), getEncryptedBytesFromFile(transactionsFileName));
  }

  return null;
}

let carryOverStock = function(fromTransactionDate, toTransactionDate, transId) {
  let prevDaySummary = getTransactionSummary(fromTransactionDate);
  addStockEntries(toTransactionDate, transId, prevDaySummary["Gold_Stock_Net"], prevDaySummary["Silver_Stock_Net"], prevDaySummary["Cash_Stock_Net"],
    true, fromTransactionDate);
}

let addStockEntries = function(transactionDate, transId, goldWeightInGrams, silverWeightInGrams, cashInRupees, isCarryOver, carryOverDate) {
  let opsType = isCarryOver ? "Carryover" : "Addition";
  let referance = isCarryOver ? carryOverDate : "";
  let stockEnteries = []
  if (goldWeightInGrams > 0) {
    stockEnteries.push(
      {
        'Transaction_Id': transId,
        'Date': transactionDate,
        'Type': "Stock " + opsType,
        'Ref': referance,
        'Item': "General",
        'Metal': "Gold",
        'Weight_In_Gram': goldWeightInGrams
      }
    );
  }

  if (silverWeightInGrams > 0) {
    stockEnteries.push(
      {
        'Transaction_Id': transId,
        'Date': transactionDate,
        'Type': "Stock " + opsType,
        'Ref': referance,
        'Item': "General",
        'Metal': "Silver",
        'Weight_In_Gram': silverWeightInGrams
      }
    );
  }

  if (cashInRupees > 0) {
    stockEnteries.push(
      {
        'Transaction_Id': transId,
        'Date': transactionDate,
        'Type': "Cash " + opsType,
        'Ref': referance,
        'Item': "General",
        'Price': cashInRupees
      }
    );
  }

  persistTransactionEntries(transactionDate, stockEnteries);
  createTransactionToken(transactionDate, transId, stockEnteries);
}

let addTransctionReversals = function(transactionDate, transId, transactions) {
  let reversals = [];
  let reversalMarkers = {};
  let headers = ("" + process.env.TRANSACTIONS_FILE_HEADER).split(',');
  for (let trans of transactions) {
    let reversalEntry = {};
    for (const header of headers) {
      reversalEntry[header] = header in trans ? trans[header] : "";
    }
    reversalEntry['Transaction_Id'] = transId;
    reversalEntry['Date'] = transactionDate;
    reversalEntry['Ref'] = trans['Date'] + "#" + trans['Id'];
    reversalEntry['Type'] = trans['Type'] + " Reversal";
    reversals.push(reversalEntry);

    if (!(trans['Date'] in reversalMarkers)) {
      reversalMarkers[trans['Date']] = [];
    }

    reversalMarkers[trans['Date']].push({
      'Date': transactionDate,
      'Ref': trans['Id'],
      'Type': "Reversal Marker"
    });
  }

  persistTransactionEntries(transactionDate, reversals);
  for (let markerDate in reversalMarkers) {
    persistTransactionEntries(markerDate, reversalMarkers[markerDate]);
  }
  createTransactionToken(transactionDate, transId, reversals);
}

let addManualTransctionReversals = function(transactionDate, transId, manualReversals) {
  let reversals = [];
  let headers = ("" + process.env.TRANSACTIONS_FILE_HEADER).split(',');
  for (let manual of manualReversals) {
    let reversalEntry = {};
    for (const header of headers) {
      reversalEntry[header] = header in manual ? manual[header] : "";
    }
    reversalEntry['Transaction_Id'] = transId;
    reversalEntry['Date'] = transactionDate;
    reversalEntry['Type'] = "Manual Sales Reversal";
    reversals.push(reversalEntry);
  }

  persistTransactionEntries(transactionDate, reversals);
  createTransactionToken(transactionDate, transId, reversals);
}

let persistTransactionEntries = function(transactionDate, transactionEntries) {

  // build transaction string
  let transaction = "";
  let headers = ("" + process.env.TRANSACTIONS_FILE_HEADER).split(',');
  for (const entry of transactionEntries) {
    let entryRow = "";
    for (const header of headers) {
      entryRow = entryRow + (entry[header] == null ? "" : entry[header]) + ",";
    }
    transaction = transaction + entryRow + '\n';
  }

  // TODO: take a lock on file here
  let transactionsFileName = process.env.BASE_DATA_DIR + transactionDate;

  // init vector for block cypher chaining
  let iv = getIthBlockFromEnd(2, transactionsFileName);
  if (iv == null) {
    iv = crypto.randomBytes(16);
  }

  // get aes256 encryption key from password
  let aes256Key = crypto.createHash('sha256').update("gV7jqM6twQ").digest();

  // get last last block
  let lastBlockEnc = getIthBlockFromEnd(1, transactionsFileName);

  // decrypt last block
  let lastBlock = "";
  if (lastBlockEnc != null) {
    lastBlock = decryptAES256(aes256Key, iv, lastBlockEnc);
  }

  // encrypt transactio
  let transactionEnc = encryptAES256(aes256Key, iv, lastBlock + transaction);

  // write encrypted transaction
  appendToFileOverwritingLastBlock(transactionsFileName, iv, transactionEnc);
}

let createTransactionToken = function(transDate, transId, transactions) {
  if (transactions.length > 0) {
    createTransTokenWindow({
      id: transId,
      bill_date: transDate,
      transactions: transactions
    });
  }
}

function createTransTokenWindow(configs) {
  transTokenWindow = new BrowserWindow({
    width: 595,
    height: 842,
    backgroundColor:'white',
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  transTokenWindow.configs = configs;
  transTokenWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'transTokenWindow.html'),
    protocol: 'file:',
    slashes: true
  }));
  transTokenWindow.once('ready-to-show', () => {
    transTokenWindow.show()
  });
  transTokenWindow.on('close', () => {
    transTokenWindow = null;
  });
}

// encryption/decryption utils
function encryptAES256(key, iv, data) {
  var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}

function decryptAES256(key, iv, data) {
  var cipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return cipher.update(data, null, 'utf8') + cipher.final('utf8');
}

// file reading/writing utility methods

// read transaction from file

// read ith block (16 bytes) from end
function getIthBlockFromEnd(i, file) {
  let blockSizeInBytes = 16;
  if (fs.existsSync(file)) {
    let fileSizeInBytes = fs.statSync(file)["size"];
    if (fileSizeInBytes >= i * blockSizeInBytes) {
      let start = fileSizeInBytes - i * blockSizeInBytes;
      let length = Math.min(fileSizeInBytes - start, blockSizeInBytes);
      return readBytesFromFile(file, start, length);
    }
  }

  return null;
}

function getFirstBlock(file) {
  let blockSizeInBytes = 16;
  if (fs.existsSync(file)) {
    let fileSizeInBytes = fs.statSync(file)["size"];
    return readBytesFromFile(file, 0, Math.min(fileSizeInBytes, blockSizeInBytes));
  }

  return null;
}

function getEncryptedBytesFromFile(file) {
  let blockSizeInBytes = 16;
  if (fs.existsSync(file)) {
    let fileSizeInBytes = fs.statSync(file)["size"];
    return readBytesFromFile(file, blockSizeInBytes, fileSizeInBytes - blockSizeInBytes);
  }

  return null;
}

function readBytesFromFile(file, start, length) {
  if (fs.existsSync(file)) {
    let pos = 0;
    let bytesRead;
    let readStart = start;
    let buffer = Buffer.alloc(length);
    let fd = fs.openSync(file, 'r');
    do {
      bytesRead = tryReadSync(fd, buffer, pos, length, readStart);
      pos += bytesRead;
      readStart = null;
    } while (bytesRead !== 0 && pos < length);

    fs.closeSync(fd);
    return buffer;
  }

  return null;
}

function tryReadSync(fd, buffer, pos, len, start) {
  let threw = true;
  let bytesRead;
  try {
    bytesRead = fs.readSync(fd, buffer, pos, len, start);
    threw = false;
  } finally {
    if (threw) fs.closeSync(fd);
  }
  return bytesRead;
}

// append to file, overwrite last block
function appendToFileOverwritingLastBlock(file, initContent, content) {
  let blockSizeInBytes = 16;
  let fileSizeInBytes = 0;
  if (fs.existsSync(file)) {
    fileSizeInBytes = fs.statSync(file)["size"];
  } else {
    fs.closeSync(fs.openSync(file, 'w'));
    content = Buffer.concat([initContent, content]);
  }

  let pos = 0;
  let bytesWrote;
  let start = Math.max(0, fileSizeInBytes - blockSizeInBytes);
  let length = Buffer.byteLength(content);
  let fd = fs.openSync(file, 'r+');
  do {
    bytesWrote = tryWriteSync(fd, content, pos, length, start);
    pos += bytesWrote;
    start = null;
  } while (bytesWrote !== 0 && pos < length);

  fs.closeSync(fd);
}

function tryWriteSync(fd, buffer, pos, len, start) {
  let threw = true;
  let bytesWrote;
  try {
    bytesWrote = fs.writeSync(fd, buffer, pos, len, start);
    threw = false;
  } finally {
    if (threw) fs.closeSync(fd);
  }
  return bytesWrote;
}

// helper function to write entries to GST report
function addGSTRecordToFile(gstFile, gstInvoiceNo, gstRecord) {
  let gstFileText = ""
  let gstRecordAdded = false;

  // write to file
  fs.readFileSync(gstFile).toString().split('\n').forEach(function (record) {
    if (Number(record.split(',')[0]) == gstInvoiceNo) {
      record = gstRecord;
      gstRecordAdded = true;
    }

    if (record !== "") {
      gstFileText += record + '\n';
    }
  });

  if (!gstRecordAdded) {
    gstFileText += gstRecord;
  }

  fs.writeFileSync(gstFile, gstFileText);
}

// helper function to write transaction entries to file
function writeTransactionToFile(filepath, filename, transaction, errorCallback) {
  // check if file exists
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath);
  }

  if (!fs.existsSync(filepath + filename)) {
    fs.appendFileSync(filepath + filename, process.env.TRANSACTIONS_FILE_HEADER + '\n');
  }

  // write to file
  fs.appendFile(filepath + filename, transaction, errorCallback);
}

module.exports = {
  loadAppConfigs,
  setMainWindow,
  getTransactions,
  getTransactionSummary,
  readTransactionEntries,
  carryOverStock,
  addStockEntries,
  addTransctionReversals,
  addManualTransctionReversals,
  persistTransactionEntries,
  getGSTSerialNumber,
  persistGSTRecord,
  savePDF,
  getTodaysRate,
  getTodaysGoldRate,
  getTodaysSilverRate,
  getGoldPurchseRateDiff,
  getSilverPurchseRateDiff,
  getPurchaseRateDiff,
  getPercentageMaking,
  getGradeMakingRateDiff,
  getGradesList,
  getGoldItemTypes,
  getSilverItemTypes,
  getAccessoriesItemTypes,
  getMappedItem,
  getSpecialDiscountOffer,
  updateMetalRate,
  saveMobileNo,
  getDirectoryContents,
  getGSTReportRecords
}
