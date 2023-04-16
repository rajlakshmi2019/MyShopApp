const url = require('url');
const path = require('path');
const {app, ipcMain} = require('electron');
const windowFactory = require('./windowFactory.js');
const Dao = require('./Dao.js');
const { getMainWindow } = require('./windowFactory.js');

/** Main process event handlers **/
app.on('ready', () => {
  Dao
  .loadAppConfigs()
  .then(() => {
    windowFactory.createMainWindow();
    windowFactory.loadMainWindowHomePage();
    windowFactory.getMainWindow().webContents.on('did-finish-load', addFirstTrayTab);
    Dao.setMainWindow(windowFactory.getMainWindow());
  });
});

ipcMain.on('open:sell', () => {
  windowFactory.createGoldSellForm('#363A42');
});

ipcMain.on('open:buy', () => {
  windowFactory.createGoldExchangeForm();
});

ipcMain.on('open:configs', () => {
  windowFactory.createUpdateConfigsWindow();
});

ipcMain.on('set:create', (event, set) => {
  let mainWindow = windowFactory.getMainWindow();
  if (set.setItems.length > 0 && set.tabIndex == null) {
    if (mainWindow.loadedPage !== "Tray") {
      mainWindow.firstTraySet = set;
      mainWindow.firstTabType = "sell";
      windowFactory.loadMainWindowTrayPage();
    } else {
      addTabForNewSet(mainWindow, set);
    }
  } else if (set.tabIndex != null) {
    addSetToOldTab(mainWindow, set);
  }
  windowFactory.getGoldSellForm().close();
});

ipcMain.on('exchange:create', (event, set) => {
  let mainWindow = windowFactory.getMainWindow();
  if (mainWindow.loadedPage !== "Tray") {
    mainWindow.firstTraySet = set;
    mainWindow.firstTabType = "exchange";
    windowFactory.loadMainWindowTrayPage();
  } else {
    mainWindow.webContents.send('add:exchange:tab', set);
  }
  windowFactory.getGoldExchangeForm().close();
});

ipcMain.on('close:tray', (event, payload) => {
  if (windowFactory.getMainWindow().loadedPage !== "Home") {
    windowFactory.loadMainWindowHomePage();
  }
});

ipcMain.on('edit:tray:item', (event, item) => {
  if (windowFactory.getEditTrayItemForm() == null) {
    windowFactory.createEditTrayItemForm(item);
  }
});

ipcMain.on('edit:tray:set', (event, tab) => {
  if (windowFactory.getGoldSellForm() == null) {
    windowFactory.createGoldSellForm('#205081');
    windowFactory.getGoldSellForm().tabIndex = tab.tabIndex;
    windowFactory.getGoldSellForm().tabName = tab.tabName;
    if (tab.metaData != null) {
      windowFactory.getGoldSellForm().sellingMetalRate = tab.metaData.sellingRate;
      windowFactory.getGoldSellForm().percentageMaking = tab.metaData.percentageMaking;
    }
  }
});

ipcMain.on('change:tray:grade', (event, tab) => {
  if (windowFactory.getGradePickerWindow() == null) {
    windowFactory.createGradePickerWindow();
    windowFactory.getGradePickerWindow().tabDetails = tab;
  }
});

ipcMain.on('set:item:update', (event, updateParams) => {
  windowFactory.getMainWindow().webContents.send('item:update', updateParams);
  windowFactory.getEditTrayItemForm().close();
});

ipcMain.on('update:selected:grade', (event, grade) => {
  windowFactory.getMainWindow().webContents.send('grade:update', grade);
  windowFactory.getGradePickerWindow().close();
});

ipcMain.on('payment:form', (event, configs) => {
  if (windowFactory.getPaymentAcceptForm() == null) {
    windowFactory.createPaymentAcceptForm(configs);
  }
});

ipcMain.on('record:transactions', (event, configs) => {
  windowFactory.getMainWindow().webContents.send('record:transactions', configs);
});

ipcMain.on('bill:create', (event, configs) => {
  windowFactory.createBillWindow(configs);
  windowFactory.getBillWindow().webContents.on('did-finish-load', () => {
    // Add gst bill to monthly GST Report
    if (configs.type === "GST") {
      Dao.persistGSTRecord(configs, configs.gstFinancialYear + '/',
        configs.gstFinancialYear + '_' + configs.gstInvoiceMonth + '_GST_Report.csv');
    }

    windowFactory.getBillWindow().webContents.printToPDF({
      marginsType: 2,
      pageSize:"A5"
    }, (error, data) => {
      if (error) console.log(error.message);

      // save to pdf file
      if (configs.savable) {
        Dao.savePDF(data, configs.gstFinancialYear + '/',
          configs.gstFinancialYear + '_' + configs.gstInvoiceMonth +
          '_GST_INVOICE_' + configs.gstInvoiceNumber + '.pdf');
      }
    });
  });
});

ipcMain.on('mobile-no:update', (event, params) => {
  windowFactory.getMainWindow().webContents.send('tab-name:update', params);
});

ipcMain.on('gst:form', (event, params) => {
  if (windowFactory.getInvoiceForm() == null) {
    windowFactory.createInvoiceForm(params);
  }
})

/** Helper Methods **/
function addFirstTrayTab() {
  let mainWindow = windowFactory.getMainWindow();
  if (mainWindow.loadedPage === "Tray" && mainWindow.firstTraySet && mainWindow.firstTabType) {
    if (mainWindow.firstTabType === "sell") {
      addTabForNewSet(mainWindow, mainWindow.firstTraySet);
    } else if (mainWindow.firstTabType === "exchange") {
      addExchangeTab(mainWindow, mainWindow.firstTraySet);
    }
    mainWindow.firstTraySet = null;
    mainWindow.firstTabType = null;
  }
}

function addTabForNewSet(mainWindow, set) {
  mainWindow.webContents.send('add:tab', set);
}

function addSetToOldTab(mainWindow, set) {
  mainWindow.webContents.send('add:set', set);
}

function addExchangeTab(mainWindow, set) {
  mainWindow.webContents.send('add:exchange:tab', set);
}
