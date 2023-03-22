const url = require('url');
const path = require('path');
const {app, BrowserWindow, Menu} = require('electron');

let mainWindow, goldSellForm, goldExchangeForm, editTrayItemForm;
let gradePickerWindow, billWindow, paymentAcceptWindow;
let updateConfigsWindow, invoiceForm, gstReportView;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    backgroundColor:'#363A42',
    show: false,
    webPreferences: {nodeIntegration: true}
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
    webPreferences: {nodeIntegration: true}
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
    webPreferences: {nodeIntegration: true}
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
    webPreferences: {nodeIntegration: true}
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
    webPreferences: {nodeIntegration: true}
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
    webPreferences: {nodeIntegration: true}
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
    webPreferences: {nodeIntegration: true}
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
    webPreferences: {nodeIntegration: true}
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
    webPreferences: {nodeIntegration: true}
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

function createGSTReportView() {
  gstReportView = new BrowserWindow({
    width: 900,
    height: 430,
    frame: false,
    backgroundColor: "#363A42",
    parent: mainWindow, modal:true,
    show: false,
    webPreferences: {nodeIntegration: true}
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
        label: 'Items',
        accelerator: 'ctrl+A'
      },
      {
        label: 'Rate',
        accelerator: 'ctrl+T'
      },
      {
        label: 'PnL',
        accelerator: 'ctrl+P'
      },
      {
        label: 'GST Report',
        accelerator: 'ctrl+G',
        click() {
          createGSTReportView();
        }
      }
    ]
  },
  {
    label: 'Tools',
    submenu: [
      {
        label: 'Toggle Devtools',
        accelerator: 'ctrl+I',
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
  createGSTReportView, getGSTReportView
};
