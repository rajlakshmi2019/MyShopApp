const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const readline = require('readline');
const csv = require('csvtojson');
const AppConfigs = require('./AppConfigs.js');
const {formatDate, formatDateReverse} = require("./utils.js");

let appConfigs = null;

let loadAppConfigs = async function() {
  let metalRateRecords = await csv().fromFile(process.env.BASE_CONFIG_DIR + 'metal_rate.csv');
  let gradesMakingRateDiffRecords = await csv().fromFile(process.env.BASE_CONFIG_DIR + 'grades_making_rate_diff.csv');
  let itemsConfigRecords = await csv().fromFile(process.env.BASE_CONFIG_DIR + 'items_config.csv');

  appConfigs = new AppConfigs(
    metalRateRecords, gradesMakingRateDiffRecords, itemsConfigRecords);
}

// let persistTransactionEntries = async function(transactionDate, transactionEntries) {
//   // Empty place holder to temprorily disable persistance of transaction entries
// }

let persistTransactionEntries = async function(transactionDate, transactionEntries) {

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

  // init vector for block cypher chaining
  let iv = getIthBlockFromEnd(2, process.env.BASE_DATA_DIR + 'running');
  if (iv == null) {
    iv = crypto.randomBytes(16);
  }

  // get aes256 encryption key from password
  let aes256Key = crypto.createHash('sha256').update("gV7jqM6twQ").digest();

  // get last last block
  let lastBlockEnc = getIthBlockFromEnd(1, process.env.BASE_DATA_DIR + 'running');

  // decrypt last block
  let lastBlock = "";
  if (lastBlockEnc != null) {
    lastBlock = decryptAES256(aes256Key, iv, lastBlockEnc);
  }

  // encrypt transaction
  transactionEnc = encryptAES256(aes256Key, iv, lastBlock + transaction);

  // write encrypted transaction
  appendToFileOverwritingLastBlock(process.env.BASE_DATA_DIR + 'running', iv, transactionEnc);
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
    fs.closeSync(fs.openSync(file, 'w'))
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
