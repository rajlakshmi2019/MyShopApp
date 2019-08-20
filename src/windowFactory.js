const url = require('url');
const path = require('path');
const {app, BrowserWindow, Menu} = require('electron');

let mainWindow, goldSellForm, goldExchangeForm, editTrayItemForm;
let priceCardView, gradePickerWindow, billWindow, paymentAcceptWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({backgroundColor:'#363A42', webPreferences: {nodeIntegration: true}});
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
    width: 1000,
    height: 800,
    frame: false,
    backgroundColor: backgroundColor,
    parent: mainWindow,
    webPreferences: {nodeIntegration: true}
  });
  goldSellForm.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'goldSellForm.html'),
    protocol: 'file:',
    slashes: true
  }));
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
    parent: mainWindow,
    webPreferences: {nodeIntegration: true}
  });
  goldExchangeForm.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'goldExchangeForm.html'),
    protocol: 'file:',
    slashes: true
  }));
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
    height: 340,
    frame: false,
    backgroundColor:'#205081',
    parent: mainWindow,
    webPreferences: {nodeIntegration: true}
  });
  editTrayItemForm.windowItem = item;
  editTrayItemForm.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'editTrayItemForm.html'),
    protocol: 'file:',
    slashes: true
  }));
  editTrayItemForm.on('close', () => {
    editTrayItemForm = null;
  });
}

function getEditTrayItemForm() {
  return editTrayItemForm;
}

function createPriceCardView(priceCardDetails) {
  priceCardView = new BrowserWindow({
    width: 550,
    height: 600,
    frame: false,
    backgroundColor:'#205081',
    parent: mainWindow,
    webPreferences: {nodeIntegration: true}
  });
  priceCardView.priceCardDetails = priceCardDetails;
  priceCardView.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'priceCardView.html'),
    protocol: 'file:',
    slashes: true
  }));
  priceCardView.on('close', () => {
    priceCardView = null;
  });
}

function getPriceCardView() {
  return priceCardView;
}

function createGradePickerWindow() {
  gradePickerWindow = new BrowserWindow({
    width: 350,
    height: 300,
    frame: false,
    backgroundColor:'#205081',
    parent: mainWindow,
    webPreferences: {nodeIntegration: true}
  });
  gradePickerWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'gradePicker.html'),
    protocol: 'file:',
    slashes: true
  }));
  gradePickerWindow.on('close', () => {
    gradePickerWindow = null;
  });
}

function getGradePickerWindow() {
  return gradePickerWindow;
}

function createBillWindow(configs) {
  billWindow = new BrowserWindow({
    width: 440,
    height: 600,
    backgroundColor:'white',
    parent: mainWindow,
    webPreferences: {nodeIntegration: true}
  });
  billWindow.configs = configs;
  billWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'billWindow.html'),
    protocol: 'file:',
    slashes: true
  }));
  billWindow.on('close', () => {
    billWindow = null;
  });
}

function getBillWindow() {
  return billWindow;
}

function createPaymentAcceptForm(configs) {
  paymentAcceptWindow = new BrowserWindow({
    width: 400,
    height: 350,
    frame: false,
    backgroundColor:'#205081',
    parent: mainWindow,
    webPreferences: {nodeIntegration: true}
  });
  paymentAcceptWindow.configs = configs;
  paymentAcceptWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html', 'paymentAcceptForm.html'),
    protocol: 'file:',
    slashes: true
  }));
  paymentAcceptWindow.on('close', () => {
    paymentAcceptWindow = null;
  });
}

function getPaymentAcceptForm() {
  return paymentAcceptWindow;
}

const mainMenuTemplate = [
  {
    label: 'Service',
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
  createPriceCardView: createPriceCardView,
  getPriceCardView: getPriceCardView,
  createGradePickerWindow, getGradePickerWindow,
  createBillWindow, getBillWindow,
  createPaymentAcceptForm, getPaymentAcceptForm
};
