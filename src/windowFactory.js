const url = require('url');
const path = require('path');
const {app, BrowserWindow, Menu} = require('electron');

let mainWindow, goldSellForm, goldExchangeForm, editTrayItemForm;
let gradePickerWindow, billWindow, transTokenWindow, paymentAcceptWindow;
let updateConfigsWindow, invoiceForm, gstReportView, transactionsReportView;
let stockCarryoverForm, stockAdditionForm, manualReversalForm;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    backgroundColor:'#363A42',
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  mainWindow.setMenu(mainMenu);
  mainWindow.maximize();
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  });
  mainWindow.on('closed', () => {
   app.quit();
  });
}

function loadMainWindowHomePage() {
  mainWindow.loadedPage = "Home";
  mainWindow.loadURL(url.format({
   pathname: path.join(__dirname, 'html', 'homeWindow.html'),
   protocol: 'file:',
   slashes: true
  }));
}

function loadMainWindowTrayPage() {
  mainWindow.loadedPage = "Tray";
  mainWindow.loadURL(url.format({
   pathname: path.join(__dirname, 'html', 'itemsTrayWindow.html'),
   protocol: 'file:',
   slashes: true
  }));
}

function getMainWindow() {
  return mainWindow;
}

function createGoldSellForm(backgroundColor) {
  goldSellForm = new BrowserWindow({
    width: 1400,
    height: 1000,
    frame: false,
    backgroundColor: backgroundColor,
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  goldSellForm.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'goldSellForm.html'),
    protocol: 'file:',
    slashes: true
  }));
  goldSellForm.once('ready-to-show', () => {
    goldSellForm.show()
  });
  goldSellForm.on('close', () => {
    goldSellForm = null;
  });
}

function getGoldSellForm() {
  return goldSellForm;
}

function createGoldExchangeForm() {
  goldExchangeForm = new BrowserWindow({
    width: 650,
    height: 460,
    frame: false,
    backgroundColor: "#363A42",
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  goldExchangeForm.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'goldExchangeForm.html'),
    protocol: 'file:',
    slashes: true
  }));
  goldExchangeForm.once('ready-to-show', () => {
    goldExchangeForm.show()
  });
  goldExchangeForm.on('close', () => {
    goldExchangeForm = null;
  });
}

function getGoldExchangeForm() {
  return goldExchangeForm;
}

function createEditTrayItemForm(item) {
  editTrayItemForm = new BrowserWindow({
    width: 1000,
    height: 310,
    frame: false,
    backgroundColor:'#205081',
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  editTrayItemForm.windowItem = item;
  editTrayItemForm.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'editTrayItemForm.html'),
    protocol: 'file:',
    slashes: true
  }));
  editTrayItemForm.once('ready-to-show', () => {
    editTrayItemForm.show()
  });
  editTrayItemForm.on('close', () => {
    editTrayItemForm = null;
  });
}

function getEditTrayItemForm() {
  return editTrayItemForm;
}

function createGradePickerWindow() {
  gradePickerWindow = new BrowserWindow({
    width: 390,
    height: 388,
    frame: false,
    backgroundColor:'#205081',
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  gradePickerWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'gradePicker.html'),
    protocol: 'file:',
    slashes: true
  }));
  gradePickerWindow.once('ready-to-show', () => {
    gradePickerWindow.show()
  });
  gradePickerWindow.on('close', () => {
    gradePickerWindow = null;
  });
}

function getGradePickerWindow() {
  return gradePickerWindow;
}

function createUpdateConfigsWindow() {
  updateConfigsWindow = new BrowserWindow({
    width: 440,
    height: 340,
    frame: false,
    backgroundColor:'#363A42',
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  updateConfigsWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'updateConfigsWindow.html'),
    protocol: 'file:',
    slashes: true
  }));
  updateConfigsWindow.once('ready-to-show', () => {
    updateConfigsWindow.show()
  });
  updateConfigsWindow.on('close', () => {
    updateConfigsWindow = null;
  });
}

function getUpdateConfigsWindow() {
  return updateConfigsWindow;
}

function createBillWindow(configs) {
  billWindow = new BrowserWindow({
    width: 595,
    height: 842,
    backgroundColor:'white',
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  billWindow.configs = configs;
  billWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'billWindow.html'),
    protocol: 'file:',
    slashes: true
  }));
  billWindow.once('ready-to-show', () => {
    billWindow.show()
  });
  billWindow.on('close', () => {
    billWindow = null;
  });
}

function getBillWindow() {
  return billWindow;
}

function createPaymentAcceptForm(configs) {
  paymentAcceptWindow = new BrowserWindow({
    width: 530,
    height: 305,
    frame: false,
    backgroundColor:'#205081',
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  paymentAcceptWindow.configs = configs;
  paymentAcceptWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'paymentAcceptForm.html'),
    protocol: 'file:',
    slashes: true
  }));
  paymentAcceptWindow.once('ready-to-show', () => {
    paymentAcceptWindow.show()
  });
  paymentAcceptWindow.on('close', () => {
    paymentAcceptWindow = null;
  });
}

function getPaymentAcceptForm() {
  return paymentAcceptWindow;
}

function createInvoiceForm(params) {
  invoiceForm = new BrowserWindow({
    width: 350,
    height: 532,
    frame: false,
    backgroundColor:'#205081',
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  invoiceForm.configs = params;
  invoiceForm.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'gstInvoiceForm.html'),
    protocol: 'file:',
    slashes: true
  }));
  invoiceForm.once('ready-to-show', () => {
    invoiceForm.show()
  });
  invoiceForm.on('close', () => {
    invoiceForm = null;
  });
}

function getInvoiceForm() {
  return invoiceForm;
}

function createStockCarryoverForm(fromDate) {
  stockCarryoverForm = new BrowserWindow({
    width: 475,
    height: 265,
    frame: false,
    backgroundColor:'#205081',
    parent: transactionsReportView, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  stockCarryoverForm.fromDate = fromDate;
  stockCarryoverForm.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'stockCarryoverForm.html'),
    protocol: 'file:',
    slashes: true
  }));
  stockCarryoverForm.once('ready-to-show', () => {
    stockCarryoverForm.show()
  });
  stockCarryoverForm.on('close', () => {
    stockCarryoverForm = null;
  });
}

function createStockAdditionForm(additionDate) {
  stockAdditionForm = new BrowserWindow({
    width: 475,
    height: 400,
    frame: false,
    backgroundColor:'#205081',
    parent: transactionsReportView, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  stockAdditionForm.additionDate = additionDate;
  stockAdditionForm.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'stockAdditionForm.html'),
    protocol: 'file:',
    slashes: true
  }));
  stockAdditionForm.once('ready-to-show', () => {
    stockAdditionForm.show()
  });
  stockAdditionForm.on('close', () => {
    stockAdditionForm = null;
  });
}

function createManualReversalForm(reversalDate) {
  manualReversalForm = new BrowserWindow({
    width: 475,
    height: 420,
    frame: false,
    backgroundColor:'#205081',
    parent: transactionsReportView, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  manualReversalForm.reversalDate = reversalDate;
  manualReversalForm.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'manualReversalForm.html'),
    protocol: 'file:',
    slashes: true
  }));
  manualReversalForm.once('ready-to-show', () => {
    manualReversalForm.show()
  });
  manualReversalForm.on('close', () => {
    manualReversalForm = null;
  });
}

function createGSTReportView() {
  gstReportView = new BrowserWindow({
    width: 900,
    height: 430,
    frame: false,
    backgroundColor: "#363A42",
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  gstReportView.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'gstReportView.html'),
    protocol: 'file:',
    slashes: true
  }));
  gstReportView.once('ready-to-show', () => {
    gstReportView.show()
  });
  gstReportView.on('close', () => {
    gstReportView = null;
  });
}

function getGSTReportView() {
  return gstReportView;
}

function createTransactionsReportView() {
  transactionsReportView = new BrowserWindow({
    width: 1300,
    height: 900,
    frame: false,
    backgroundColor: "#363A42",
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true, devTools: !app.isPackaged}
  });
  transactionsReportView.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'transactionsReportView.html'),
    protocol: 'file:',
    slashes: true
  }));
  transactionsReportView.once('ready-to-show', () => {
    transactionsReportView.show()
  });
  transactionsReportView.on('close', () => {
    transactionsReportView = null;
  });
}

function getTransactionsReportView() {
  return transactionsReportView;
}

const mainMenuTemplate = [
  {
    label: 'Services',
    submenu: [
      {
        label: 'Sell',
        accelerator: 'ctrl+S',
        click() {
          createGoldSellForm('#363A42');
        }
      },
      {
        label: 'Buy/Exchange',
        accelerator: 'ctrl+E',
        click() {
          createGoldExchangeForm();
        }
      },
      {
        label: 'Quit',
        accelerator: 'ctrl+Q',
        click() {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'GST Report',
        accelerator: 'ctrl+G',
        click() {
          createGSTReportView();
        }
      },
      {
        label: 'Transactions Report',
        accelerator: 'ctrl+T',
        click() {
          createTransactionsReportView();
        }
      }
    ]
  },
  {
    label: 'Tools',
    submenu: [
      {
        label: 'Toggle Devtools',
        accelerator: 'ctrl+shift+I',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]
  }
];

const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

module.exports = {
  createMainWindow: createMainWindow,
  getMainWindow: getMainWindow,
  loadMainWindowHomePage: loadMainWindowHomePage,
  loadMainWindowTrayPage: loadMainWindowTrayPage,
  createGoldSellForm: createGoldSellForm,
  createGoldExchangeForm, getGoldExchangeForm,
  getGoldSellForm: getGoldSellForm,
  createEditTrayItemForm: createEditTrayItemForm,
  getEditTrayItemForm: getEditTrayItemForm,
  createUpdateConfigsWindow,getUpdateConfigsWindow,
  createGradePickerWindow, getGradePickerWindow,
  createBillWindow, getBillWindow,
  createPaymentAcceptForm, getPaymentAcceptForm,
  createInvoiceForm, getInvoiceForm,
  createGSTReportView, getGSTReportView,
  createTransactionsReportView, getTransactionsReportView,
  createStockCarryoverForm, createStockAdditionForm, createManualReversalForm
};
