const fs = require('fs');
const readline = require('readline');
const csv = require('csvtojson');
const AppConfigs = require('./AppConfigs.js');
const {formatDate, formatDateReverse} = require("./utils.js");

let appConfigs = null;

let loadAppConfigs = async function() {
  let metalRateRecords = await csv().fromFile(process.env.BASE_CONFIG_DIR + 'metal_rate.csv');
  let purchaseRateDiffRecords = await csv().fromFile(process.env.BASE_CONFIG_DIR + 'purchase_rate_diff.csv');
  let gradesMakingRateDiffRecords = await csv().fromFile(process.env.BASE_CONFIG_DIR + 'grades_making_rate_diff.csv');
  let itemsConfigRecords = await csv().fromFile(process.env.BASE_CONFIG_DIR + 'items_config.csv');

  appConfigs = new AppConfigs(
    metalRateRecords, purchaseRateDiffRecords, gradesMakingRateDiffRecords, itemsConfigRecords);
}

let persistTransactionEntries = function(transactionDate, transactionEntries, callback) {

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

  // write to transactions file
  writeTransactionToFile(process.env.BASE_DATA_DIR, 'transactions.csv', transaction, (err) => {
    if(err) {
      // write to backup file if error
      writeTransactionToFile(process.env.LOCAL_DATA_DIR, 'transactions.csv', transaction, (err) => {});
    }

    // callback of completion
    callback();
  });

  // write to dated transactions file
  let reverseDateText = formatDateReverse(transactionDate);
  let datedFilePath = process.env.BASE_DATA_DIR + reverseDateText.slice(0, -2) + '/';
  writeTransactionToFile(datedFilePath, 'transactions_' + reverseDateText + '.csv', transaction, (err) => {});
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
  getMappedItem
}
