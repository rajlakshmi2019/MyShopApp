const url = require('url');
const path = require('path');
const {app, ipcMain} = require('electron');
const windowFactory = require('./windowFactory.js');
const Dao = require('./Dao.js');

/** Main process event handlers **/
app.on('ready', () => {
  Dao
  .loadAppConfigs()
  .then(() => {
    windowFactory.createMainWindow();
    windowFactory.loadMainWindowHomePage();
    windowFactory.getMainWindow().webContents.on('did-finish-load', addFirstTrayTab);
  });
});

ipcMain.on('open:sell', () => {
  windowFactory.createGoldSellForm('#363A42');
});

ipcMain.on('open:buy', () => {
  windowFactory.createGoldExchangeForm();
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

ipcMain.on('view:price:card', (event, priceCardDetails) => {
  if (windowFactory.getPriceCardView() == null) {
    windowFactory.createPriceCardView(priceCardDetails);
  }
});

ipcMain.on('update:selected:grade', (event, grade) => {
  windowFactory.getMainWindow().webContents.send('grade:update', grade);
  windowFactory.getGradePickerWindow().close();
});

ipcMain.on('bill:create', (event, configs) => {
  windowFactory.createBillWindow(configs);
  windowFactory.getBillWindow().webContents.on('did-finish-load', () => {
    windowFactory.getBillWindow().webContents.printToPDF({
      marginsType: 2,
      pageSize:"A5"
    }, (error, data) => {
      if(error) return console.log(error.message);

      // save to pdf file
      Dao.savePDF(data,
        configs.bill_date_reverse.slice(0, -2) + '/', configs.bill_date_reverse + '_' + configs.id + ".pdf");
    });
  });
});

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
