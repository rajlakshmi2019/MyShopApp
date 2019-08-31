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
  let aes256Key = crypto.createHash('sha256').update("*******").digest();

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

let savePDF = function(pdf, filedir, filename) {
  let filepath = process.env.BASE_DATA_DIR + filedir;

  // check if file exists
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath);
  }

  // write to file
  fs.writeFile(filepath + filename, pdf, (error) => {
    if (error) return console.log(error.message);
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

let getMappedItem = function(itemKey) {
  return appConfigs.itemConfigs.get(itemKey);
}

let updateMetalRate = async function(metalRate, purchaseRateDiff) {
  let metalRateContent = "METAL,RATE,DIFF\n" +
    "Gold," + metalRate.Gold + "," + purchaseRateDiff.Gold + "\n" +
    "Silver," + metalRate.Silver + "," + purchaseRateDiff.Silver + "\n";
    // write to file
    fs.writeFileSync(process.env.BASE_CONFIG_DIR + 'metal_rate.csv', metalRateContent);
    loadAppConfigs();
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
  fs.appendFile(filepath + filename, transaction);
}

module.exports = {
  loadAppConfigs,
  persistTransactionEntries,
  savePDF,
  getTodaysRate,
  getTodaysGoldRate,
  getTodaysSilverRate,
  getGoldPurchseRateDiff,
  getSilverPurchseRateDiff,
  getPurchaseRateDiff,
  getGradeMakingRateDiff,
  getGradesList,
  getGoldItemTypes,
  getSilverItemTypes,
  getMappedItem,
  updateMetalRate
}
