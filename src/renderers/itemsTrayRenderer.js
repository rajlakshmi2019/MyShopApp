const {ipcRenderer, remote} = require("electron");
const {clearSelection, createHtmlElement, addTableHeader, addTableData,
  emptyTable, parseTable, getDesiNumber, consolidateEntries, getFromDesiRupeeNumber,
  generateTransactionId, formatDate, formatDateSlash, formatDateReverse} = require("./../utils.js");
const ShopCalculator = require("./../ShopCalculator.js");
const Dao = remote.require("./Dao.js");

/* add tab button listeners */
document.getElementById("tab-add-sell").addEventListener("click", () => {
  ipcRenderer.send('open:sell', null);
});

document.getElementById("tab-add-buy").addEventListener("click", () => {
  ipcRenderer.send('open:buy', null);
});

/* ipc signal handlers */
ipcRenderer.on("add:tab", (event, set) => {
  addTab("sell", set);
});

ipcRenderer.on("add:exchange:tab", (event, emptySet) => {
  addTab("exchange", emptySet);
});

ipcRenderer.on('item:update', (event, updateParams) => {
  let priceCardContainer = document.getElementById(
    getItemIdString("price-card-container", updateParams.itemName, updateParams.tabIndex));
  createPriceCards(updateParams.weightList, updateParams, priceCardContainer);

  let currnetPriceGrade = getAppliedPriceGrade(getTabIndexFromId(priceCardContainer.id));
  addPriceLabels(updateParams, priceCardContainer, currnetPriceGrade, currnetPriceGrade);
});

ipcRenderer.on('add:set', (event, set) => {
  let tabIndex = set.tabIndex;
  let metaDataContainer = document.getElementById("meta-data-container-" + tabIndex);
  populateMetaData(metaDataContainer, set);

  // if nothing added select exchange tab
  let sellTrayContainer = document.getElementById("sell-tray-container-" + tabIndex);
  if (set.setItems.length == 0) {
    // if (sellTrayContainer.getElementsByClassName("price-card-box").length == 0) {
    //   let exchangeTrayContainer = document.getElementById("exchange-tray-container-" + tabIndex);
    //   selectTrayContainer(tabIndex, exchangeTrayContainer);
    // }
  } else {
    setUpSellTrayDisplay(sellTrayContainer, set.setItems);
  }
});

ipcRenderer.on('grade:update', (event, grade) => {
  let tabContent = document.getElementById("tab-content-" + grade.tabIndex);
  let priceCardContainers = tabContent.getElementsByClassName("price-card-container");
  for(let i=0; i<priceCardContainers.length; i++) {
    let priceCardContainer = priceCardContainers[i];
    let itemInfoCard = priceCardContainer.querySelector(".item-info-card");
    let currentItem = getCurentItem({
      itemName: itemInfoCard.querySelector(".item-label").textContent,
      metal: getItemType(itemInfoCard.classList)
    }, itemInfoCard);
    addPriceLabels(currentItem, priceCardContainer, getAppliedPriceGrade(grade.tabIndex), grade.newGrade);
  }

  document.getElementById("applied-price-grade-" + grade.tabIndex).textContent = grade.newGrade;
});

ipcRenderer.on('mark:pending', (event, configs) => {
  finishTransaction(configs.tabIndex, configs);
});

/* Build tab button and content */
function addTab(tabType, set) {
  let tabIndex = maxTabIndex();
  let tab = buildTab(tabIndex, set);
  let tabContent = tab.tabContent;
  let tabButton = tab.tabButton;

  let metaDataContainer = buildMetaDataContainer(tabContent, set);
  let sellTrayContainer = buildSellTrayContainer(tabContent, set);
  let exchangeTrayContainer = buildExchangeTrayContainer(tabContent, set);
  let netTotalContainer = buildNetTotalContainer(tabContent, set);

  /* Add switch button event listeners */
  sellTrayContainer.querySelector(".switch-tray-button")
    .addEventListener("click", () => {
      selectTrayContainer(tabIndex, exchangeTrayContainer);
    });

  sellTrayContainer.querySelector(".proceed-button")
    .addEventListener("click", () => {
      populateNetTotalContainer(tabIndex);
      selectTrayContainer(tabIndex, netTotalContainer);
    });

  exchangeTrayContainer.querySelector(".switch-tray-button")
    .addEventListener("click", () => {
      selectTrayContainer(tabIndex, sellTrayContainer);
      if (sellTrayContainer.getElementsByClassName("price-card-box").length == 0) {
        let tabName = tabButton.textContent.slice(0, -1);
        ipcRenderer.send('edit:tray:set', {tabIndex: tabIndex, tabName: tabName, metaData: getMetaData(tabIndex)});
      }
    });

  exchangeTrayContainer.querySelector(".proceed-button")
    .addEventListener("click", () => {
      populateNetTotalContainer(tabIndex);
      selectTrayContainer(tabIndex, netTotalContainer);
    });

  netTotalContainer.querySelector(".back-button")
    .addEventListener("click", () => {
      if (sellTrayContainer.getElementsByClassName("price-card-box").length == 0) {
        selectTrayContainer(tabIndex, exchangeTrayContainer);
      } else {
        selectTrayContainer(tabIndex, sellTrayContainer);
      }
    });

  netTotalContainer.querySelector(".finish-transaction-button")
    .addEventListener("click", () => {
      let netTotal = document.getElementById("net-total-display-" + tabIndex).innerHTML
      if (netTotal.startsWith("- ₹")) {
        remote.dialog.showMessageBox(
          remote.getCurrentWindow(),
          {
            type: 'question',
            buttons: ['Yes', 'No'],
            defaultId: 1,
            title: 'Remember to add the discount',
            message: 'Mark this transaction completed?',
            detail: 'Amount to be paid to the customer ' + netTotal.substring(2)
          },
          (response) => {
            if (response == 0) {
              finishTransaction(tabIndex, {});
            }
          });
      } else {
        ipcRenderer.send('payment:accept', {
          tabIndex: tabIndex,
          netTotal: netTotal
        });
      }
    });

  /* Select tray and tab */
  if (tabType === "sell") {
    selectTrayContainer(tabIndex, sellTrayContainer);
  } else if (tabType === "exchange") {
    selectTrayContainer(tabIndex, exchangeTrayContainer);
  }

  selectTab(tabButton);
}

function buildTab(tabIndex, set) {
  let tabButton = createHtmlElement("div", "tab-button float-left", "tab-button-" + tabIndex, null, null);
  document.querySelector(".tab-buttons").appendChild(tabButton);
  let tabSelectButton = createHtmlElement("button", "select-tab", null, null, null);
  tabSelectButton.addEventListener("click", function() {
    selectTab(this.parentElement);
  });
  tabButton.appendChild(tabSelectButton);
  let tabName = createHtmlElement("label", "tab-name", null, set.setName + " " + (tabIndex+1), null);
  tabSelectButton.appendChild(tabName);
  let tabCloseButton = createHtmlElement("button", "close-tab", null, null, decodeURI("&times;"));
  tabCloseButton.addEventListener("click", function() {
    confirmAndCloseTab(this.parentElement);
  })
  tabButton.appendChild(tabCloseButton);

  let tabContent = createHtmlElement("div", "tab-content", "tab-content-" + tabIndex, null, null);
  document.querySelector(".tab-contents-container").appendChild(tabContent);

  return { tabContent, tabButton };
}

/* Sell tray set up methods */

function buildSellTrayContainer(tabContent, set) {
  let tabIndex = getTabIndexFromId(tabContent.id);

  let sellTrayContainer = createHtmlElement("div", "full-tray-container", "sell-tray-container-" + tabIndex, null, null);
  tabContent.appendChild(sellTrayContainer);

  let trayControlsContainer = createHtmlElement("div", "tray-controls-container", null, null, null);
  sellTrayContainer.appendChild(trayControlsContainer);
  let switchTrayButton =
    createHtmlElement("button", "tray-window-button controller-button switch-tray-button float-left", "sell-switch-tray-button-" + tabIndex, null, null);
  trayControlsContainer.appendChild(switchTrayButton);
  let addItemsButton =
    createHtmlElement("button", "tray-window-button controller-button add-more-items-button float-left", "add-more-items-button-" + tabIndex, null, null);
  addItemsButton.addEventListener("click", () => {
    let tabName = document.getElementById("tab-button-" + tabIndex).textContent.slice(0, -1);
    ipcRenderer.send('edit:tray:set', {tabIndex: tabIndex, tabName: tabName, metaData: getMetaData(tabIndex)});
  });
  trayControlsContainer.appendChild(addItemsButton);
  let changePriceGrade =
    createHtmlElement("button", "tray-window-button controller-button change-price-grade-button float-left", "price-grade-" + tabIndex, null, null);
  changePriceGrade.addEventListener("click", () => {
    ipcRenderer.send('change:tray:grade', {tabIndex: tabIndex, appliedPriceGrade: getAppliedPriceGrade(tabIndex)});
  });
  trayControlsContainer.appendChild(changePriceGrade);
  let proceedButton =
    createHtmlElement("button", "tray-window-button controller-button proceed-button float-left", "sell-proceed-button-" + tabIndex, null, null);
  trayControlsContainer.appendChild(proceedButton);

  trayControlsContainer.appendChild(proceedButton);
  let topDisplay = createHtmlElement("div", "top-display align-right", null, null, null);
  trayControlsContainer.appendChild(topDisplay);
  let priceGradeDisplay = createHtmlElement(
    "div", "total-price-display number-font metal-price float-left align-right", "applied-price-grade-" + tabIndex, null, "B");
  topDisplay.appendChild(priceGradeDisplay);
  let totalPriceDisplay = createHtmlElement(
    "div", "total-price-display number-font money-green float-right align-right", "total-price-display-" + tabIndex, null, decodeURI("&#8377;") + " 0");
  topDisplay.appendChild(totalPriceDisplay);

  setUpSellTrayDisplay(sellTrayContainer, set.setItems);
  return sellTrayContainer;
}

function setUpSellTrayDisplay(sellTrayContainer, itemsList) {
  let tabIndex = getTabIndexFromId(sellTrayContainer.id);
  let trayContainerId = getIdString("tray-container " + tabIndex);
  let trayContainer = document.getElementById(trayContainerId);
  if (trayContainer == null) {
    trayContainer = createHtmlElement("div", "tray-container", trayContainerId, null, null);
    sellTrayContainer.appendChild(trayContainer);
  }

  // auto select price card when only one entry
  autoSelectPriceCard = sellTrayContainer.getElementsByClassName("price-card-box").length == 0
    && itemsList.length == 1 && itemsList[0].weightList.length == 1;
  for (let i=0; i<itemsList.length; i++) {
    let item = itemsList[i];
    let itemName = item.itemName
    let itemColorCode = getItemColorCode(item.metal);
    let itemColor = itemColorCode.itemColor;
    let itemInnerShadow = itemColorCode.itemInnerShadow;
    let itemOuterShadow = itemColorCode.itemOuterShadow;

    let itemPriceCardBoxId = getItemIdString("price-card-box", itemName, tabIndex);
    let priceCardBox = document.getElementById(itemPriceCardBoxId);
    if (priceCardBox == null) {
      priceCardBox = createHtmlElement("div", "price-card-box " + itemInnerShadow, itemPriceCardBoxId, null, null);
      trayContainer.appendChild(priceCardBox);
    }

    let itemPriceCardContainerId = getItemIdString("price-card-container", itemName, tabIndex);
    let priceCardContainer = document.getElementById(itemPriceCardContainerId);
    if (priceCardContainer == null) {
      priceCardContainer = createHtmlElement("div", "price-card-container foat-left", itemPriceCardContainerId, null, null);
      priceCardBox.appendChild(priceCardContainer);
    }

    let itemInfoCardId = getItemIdString("info-card", itemName, tabIndex);
    let itemInfoCard = document.getElementById(itemInfoCardId);
    if (itemInfoCard == null) {
      itemInfoCard = createHtmlElement("a", "price-card item-info-card " + itemOuterShadow + " " + itemColor, itemInfoCardId, null, null);
      itemInfoCard.addEventListener('click', (event) => {
        event.preventDefault();
        clearSelection();
      });
      itemInfoCard.addEventListener("dblclick", function(event) {
        event.preventDefault();
        clearSelection();
        ipcRenderer.send('edit:tray:item', getCurentItem(item, this));
      });
      priceCardContainer.appendChild(itemInfoCard);
      let itemLabel = createHtmlElement("h3", "item-label", null, item.itemName, null);
      itemInfoCard.appendChild(itemLabel);
      let itemRateLabel = createHtmlElement("h2", "number-font metal-rate align-right padding-top-fifteen", null, null, null);
      itemInfoCard.appendChild(itemRateLabel);
      let itemMinMakingLabel = createHtmlElement("div", "number-font min-making-charge float-left", null, null, null);
      itemInfoCard.appendChild(itemMinMakingLabel);
      let itemMakingRateLabel = createHtmlElement("div", "number-font making-rate align-right", null, null, null);
      itemInfoCard.appendChild(itemMakingRateLabel);
    }

    createPriceCards(item.weightList, item, priceCardContainer, autoSelectPriceCard);

    // The default item rates are A grade rates
    let currnetPriceGrade = getAppliedPriceGrade(tabIndex);
    addPriceLabels(item, priceCardContainer, "A", currnetPriceGrade);

    let priceCardBoxButtons = priceCardBox.querySelector(".price-card-box-buttons-container");
    if (priceCardBoxButtons == null) {
      priceCardBoxButtons = createHtmlElement("div", "price-card-box-buttons-container float-right", null, null, null);
      priceCardBox.appendChild(priceCardBoxButtons);
      let addItemButton = createHtmlElement("button", "tray-window-button add-item-button " + itemOuterShadow, null, null, null);
      addItemButton.addEventListener("click", function() {
        ipcRenderer.send('edit:tray:item', getCurentItem(item, itemInfoCard));
      });
      priceCardBoxButtons.appendChild(addItemButton);
      let editItemButton = createHtmlElement("button", "tray-window-button edit-item-button " + itemOuterShadow, null, null, null);
      editItemButton.addEventListener("click", function() {
        ipcRenderer.send('edit:tray:item', getCurentItem(item, itemInfoCard));
      });
      priceCardBoxButtons.appendChild(editItemButton);
      let removeItemButton = createHtmlElement("button", "tray-window-button remove-item-button " + itemOuterShadow, null, null, null);
      removeItemButton.addEventListener("click", function() {
        priceCardBox.remove();
        updateTotalSalesPrice(tabIndex);
        // if (sellTrayContainer.getElementsByClassName("price-card-box").length == 0) {
        //   let tabName = document.getElementById("tab-button-" + tabIndex).textContent.slice(0, -1);
        //   ipcRenderer.send('edit:tray:set', {tabIndex: tabIndex, tabName: tabName, metaData: getMetaData(tabIndex)});
        // }
      });
      priceCardBoxButtons.appendChild(removeItemButton);
    }
  }
}

function createPriceCards(weightList, item, priceCardContainer, autoSelectPriceCard) {
  let itemColorCode = getItemColorCode(item.metal);
  let itemColor = itemColorCode.itemColor;
  let itemInnerShadow = itemColorCode.itemInnerShadow;
  let itemOuterShadow = itemColorCode.itemOuterShadow;
  for (let i=0; i<weightList.length; i++) {
    let weight = weightList[i];
    itemPriceCardClass = autoSelectPriceCard ? "price-card price-card-selectable price-card-selected" : "price-card price-card-selectable"
    let itemPriceCard = createHtmlElement("a", itemPriceCardClass + " " + itemOuterShadow + " " + itemColor, null, null, null);
    itemPriceCard.addEventListener('click', function(event) {
      event.preventDefault();
      if (this.classList.contains("price-card-selected")) {
        this.classList.remove("price-card-selected");
      } else {
        this.classList.add("price-card-selected");
      }
      updateTotalSalesPrice(getTabIndexFromId(priceCardContainer.id));
      clearSelection();
    });
    itemPriceCard.addEventListener("dblclick", (event) => {
      event.preventDefault();
      let itemInfoCard = priceCardContainer.querySelector(".item-info-card");
      let currentItem = getCurentItem(item, itemInfoCard);
      let priceCardDetails = {...currentItem, weight: weight};
      ipcRenderer.send('view:price:card', priceCardDetails);
      clearSelection();
    });
    priceCardContainer.appendChild(itemPriceCard);
    let cardWeightLabel = createHtmlElement("h3", "item-label", null, weight.toString() + " g", null);
    itemPriceCard.appendChild(cardWeightLabel);
    let cardPriceLabel = createHtmlElement("h2", "number-font money-green align-right padding-top-fifteen", null, null, null);
    itemPriceCard.appendChild(cardPriceLabel);
    let cardMetalPriceLabel = createHtmlElement("div", "number-font metal-price float-left", null, null, null);
    itemPriceCard.appendChild(cardMetalPriceLabel);
    let cardMakingPriceLabel = createHtmlElement("div", "number-font making-charge align-right", null, null, null);
    itemPriceCard.appendChild(cardMakingPriceLabel);
  }
}

function addPriceLabels(item, priceCardContainer, appliedPricingGrade, newPricingGrade) {
  let gradeMakingRateDiff = Dao.getGradeMakingRateDiff();
  let mappedItem = Dao.getMappedItem([item.metal, item.itemName].toString());
  let priceCards = priceCardContainer.getElementsByClassName("price-card");
  for(let i=0; i<priceCards.length; i++) {
    priceCard = priceCards[i];
    if (i == 0) {
      priceCard.querySelector(".metal-rate").innerHTML = "₹ " + getDesiNumber(item.ratePerGram) +" /g";
      priceCard.querySelector(".min-making-charge").innerHTML = "₹ " + getDesiNumber(
        ShopCalculator.calculateGradeMakingRate(item.minimumMakingCharge,
          (gradeMakingRateDiff[appliedPricingGrade][mappedItem.METAL].MM_DIFF * mappedItem.MM_DIFF_UNIT),
          (gradeMakingRateDiff[newPricingGrade][mappedItem.METAL].MM_DIFF * mappedItem.MM_DIFF_UNIT)));
      priceCard.querySelector(".making-rate").innerHTML = "₹ " + getDesiNumber(
        ShopCalculator.calculateGradeMakingRate(item.makingPerGram,
          (gradeMakingRateDiff[appliedPricingGrade][mappedItem.METAL].DIFF * mappedItem.DIFF_UNIT),
          (gradeMakingRateDiff[newPricingGrade][mappedItem.METAL].DIFF  * mappedItem.DIFF_UNIT))) + " /g";
    } else {
      let weight = parseFloat(priceCard.querySelector(".item-label").textContent);
      priceCard.querySelector(".money-green").innerHTML = "₹ " + getDesiNumber(
        ShopCalculator.calculateGardePrice(weight, item.ratePerGram,
          item.makingPerGram, item.minimumMakingCharge, mappedItem.APPLIED,
          gradeMakingRateDiff[appliedPricingGrade][mappedItem.METAL],
          gradeMakingRateDiff[newPricingGrade][mappedItem.METAL],
          mappedItem.DIFF_UNIT, mappedItem.MM_DIFF_UNIT));
      priceCard.querySelector(".metal-price").innerHTML = "₹ " + getDesiNumber(
        ShopCalculator.calculateMetalPrice(weight, item.ratePerGram, mappedItem.APPLIED));
      priceCard.querySelector(".making-charge").innerHTML = "₹ " + getDesiNumber(
        ShopCalculator.calculateGradeMakingCharge(weight, item.makingPerGram, item.minimumMakingCharge,
          gradeMakingRateDiff[appliedPricingGrade][mappedItem.METAL],
          gradeMakingRateDiff[newPricingGrade][mappedItem.METAL],
          mappedItem.DIFF_UNIT, mappedItem.MM_DIFF_UNIT));
    }
  }

  updateTotalSalesPrice(getTabIndexFromId(priceCardContainer.id));
}

/* Exchange tray set up methods */

function buildExchangeTrayContainer(tabContent, set) {
  let tabIndex = getTabIndexFromId(tabContent.id);

  let exchangeTrayContainer = createHtmlElement("div", "full-tray-container", "exchange-tray-container-" + tabIndex, null, null);
  tabContent.appendChild(exchangeTrayContainer);

  let trayControlsContainer = createHtmlElement("div", "tray-controls-container", null, null, null);
  exchangeTrayContainer.appendChild(trayControlsContainer);
  let switchTrayButton =
    createHtmlElement("button", "tray-window-button controller-button switch-tray-button float-left", "exchange-switch-tray-button-" + tabIndex, null, null);
  trayControlsContainer.appendChild(switchTrayButton);
  let proceedButton =
    createHtmlElement("button", "tray-window-button controller-button proceed-button float-left", "exchange-proceed-button-" + tabIndex, null, null);
  trayControlsContainer.appendChild(proceedButton);
  let totalPurchasePriceDisplay = createHtmlElement(
    "div", "total-price-display number-font red-color float-right align-right", "total-purchase-price-display-" + tabIndex, null, decodeURI("&#8377;") + " 0");
  trayControlsContainer.appendChild(totalPurchasePriceDisplay);

  /* Gold exchange window */
  setupExchangeWindow("Gold", exchangeTrayContainer);

  /* Silver exchange window*/
  setupExchangeWindow("Silver", exchangeTrayContainer);

  return exchangeTrayContainer;
}

function setupExchangeWindow(metal, exchangeTrayContainer) {
  let tabIndex = getTabIndexFromId(exchangeTrayContainer.id);

  let color = "others";
  let floatType = "middle";
  if (metal === "Gold") {
    color = "gold";
    floatType = "left";
  } else if (metal === "Silver") {
    color = "silver";
    floatType = "right";
  }

  let exchangeWindowContainer = createHtmlElement("div", "exchange-window-container float-" + floatType, color + "-exchange-window-container-" + tabIndex, null, null);
  exchangeTrayContainer.appendChild(exchangeWindowContainer);
  let exchangeWindowHeader = createHtmlElement("div", "bold-font large-font align-center " + color + "-color", null, null, metal);
  exchangeWindowContainer.appendChild(exchangeWindowHeader);
  let exchangeWindow = createHtmlElement("div", "exchange-window " + color + "-inner-shadow", color + "-exchange-window-" + tabIndex, null, null);
  exchangeWindowContainer.appendChild(exchangeWindow);
  addExchangeCard(exchangeWindow, metal);

  let addExchangeCardButton =
    createHtmlElement("button", "add-exchange-card-button down-arrow-button tray-window-button float-center " + color + "-outer-shadow", null, null, null);
  addExchangeCardButton.addEventListener('click', function() {
    addExchangeCard(exchangeWindow, metal);
  });
  exchangeWindowContainer.appendChild(addExchangeCardButton);
}

function addExchangeCard(exchangeWindow, metal) {
  let tabIndex = getTabIndexFromId(exchangeWindow.id);

  let color = "others";
  if (metal === "Gold") {
    color = "gold";
  } else if (metal === "Silver") {
    color = "silver";
  }

  let exchangeCard = createHtmlElement("div", "exchange-price-card exchange-card " + color + "-outer-shadow " + color + "-color", null, null, null);
  exchangeWindow.appendChild(exchangeCard);

  let exchangeCardTopDiv = createHtmlElement("div", "wrapper-div", null, null, null);
  exchangeCard.appendChild(exchangeCardTopDiv);
  let exchangeCardPriceLabel = createHtmlElement("div", "exchange-card-label float-left number-font " + color + "-color", null, null, decodeURI("&#8377;") + " 0");
  exchangeCardTopDiv.appendChild(exchangeCardPriceLabel);
  let exchangeCardCloseButton = createHtmlElement("div", "exchange-card-close-button no-padding float-right " + color + "-color", null, null, decodeURI("&times;"));
  exchangeCardCloseButton.addEventListener('click', (event) => {
    exchangeCard.remove();
    updateTotalPurchasePrice(tabIndex);
  });
  exchangeCardTopDiv.appendChild(exchangeCardCloseButton);

  let weightInputBox = createHtmlElement("div", "wrapper-div weight-input-box", null, null, null);
  exchangeCard.appendChild(weightInputBox);
  let weightInput = createHtmlElement("input", "weight-input input-inline-text gram-background float-right align-right", null, null, null);
  weightInput.type = "text";
  weightInput.style.width = "100px";
  weightInputBox.appendChild(weightInput);
  let weightInputHeader = createHtmlElement("div", "input-inline-header float-right align-bottom", null, null, "Weight");
  weightInputBox.appendChild(weightInputHeader);

  let exchangeCardChipsDiv = createHtmlElement("div", "wrapper-div", null, null, null);
  exchangeCard.appendChild(exchangeCardChipsDiv);
  let exchangeCardSellPriceChip = createExchangeCardChip("sell-price-chip float-right", color, "@ Selling Rate");
  exchangeCardChipsDiv.appendChild(exchangeCardSellPriceChip);
  let exchangeCardPurchasePriceChip = createExchangeCardChip("purchase-price-chip float-left", color, "@ Purchase Rate");
  exchangeCardChipsDiv.appendChild(exchangeCardPurchasePriceChip);

  let sellRateInput = exchangeCardSellPriceChip.querySelector(".rate-per-gram");
  let sellPercentagePurityInput = exchangeCardSellPriceChip.querySelector(".purity-percentage");

  let purchaseRateInput = exchangeCardPurchasePriceChip.querySelector(".rate-per-gram");
  let purchasePercentagePurityInput = exchangeCardPurchasePriceChip.querySelector(".purity-percentage");

  /* pre populate fields */
  populateRateFields(metal, exchangeCard, weightInput, sellRateInput, sellPercentagePurityInput, purchaseRateInput, purchasePercentagePurityInput);

  /* change event listeners for input box */
  weightInput.addEventListener('keyup', function() {
    if(sellPercentagePurityInput.value !== '' && !isNaN(Number(sellPercentagePurityInput.value))) {
      let purchasePrice = updatePurchasePrice(
        exchangeCard, Number(weightInput.value), Number(sellRateInput.value), Number(sellPercentagePurityInput.value));
      if (purchasePercentagePurityInput.value === '' || isNaN(Number(purchasePercentagePurityInput.value))) {
        purchasePercentagePurityInput.value = calculateImpliedPurity(purchasePrice, Number(weightInput.value), Number(purchaseRateInput.value));
      }
    } else if (purchasePercentagePurityInput.value !== '' && !isNaN(Number(purchasePercentagePurityInput.value))) {
      let purchasePrice = updatePurchasePrice(
        exchangeCard, Number(weightInput.value), Number(purchaseRateInput.value), Number(purchasePercentagePurityInput.value));
      if (sellPercentagePurityInput.value === '' || isNaN(Number(sellPercentagePurityInput.value))) {
        sellPercentagePurityInput.value = calculateImpliedPurity(purchasePrice, Number(weightInput.value), Number(sellRateInput.value));
      }
    }

    updateTotalPurchasePrice(tabIndex);
  });

  sellRateInput.addEventListener('keyup', function() {
    let purchasePrice = getFromDesiRupeeNumber(exchangeCardPriceLabel.innerHTML);
    sellPercentagePurityInput.value = calculateImpliedPurity(purchasePrice, Number(weightInput.value), Number(sellRateInput.value));
    updateTotalPurchasePrice(tabIndex);
  });

  sellPercentagePurityInput.addEventListener('keyup', function() {
    let purchasePrice = updatePurchasePrice(
      exchangeCard, Number(weightInput.value), Number(sellRateInput.value), Number(sellPercentagePurityInput.value));
    purchasePercentagePurityInput.value = calculateImpliedPurity(purchasePrice, Number(weightInput.value), Number(purchaseRateInput.value));
    updateTotalPurchasePrice(tabIndex);
  });

  purchaseRateInput.addEventListener('keyup', function(event) {
    let purchasePrice = getFromDesiRupeeNumber(exchangeCardPriceLabel.innerHTML);
    purchasePercentagePurityInput.value = calculateImpliedPurity(purchasePrice, Number(weightInput.value), Number(purchaseRateInput.value));
    updateTotalPurchasePrice(tabIndex);
  });

  purchasePercentagePurityInput.addEventListener('keyup', function() {
    let purchasePrice = updatePurchasePrice(
      exchangeCard, Number(weightInput.value), Number(purchaseRateInput.value), Number(purchasePercentagePurityInput.value));
    sellPercentagePurityInput.value = calculateImpliedPurity(purchasePrice, Number(weightInput.value), Number(sellRateInput.value));
    updateTotalPurchasePrice(tabIndex);
  });
}

function createExchangeCardChip(className, color, label) {
  let exchangeCardChip = createHtmlElement("div", className + " exchange-card-chip " + color + "-full-background " + color +"-border", null, null, null);

  // let chipHeader = createHtmlElement("div", "chip-header input-header", null, null, label);
  // exchangeCardChip.appendChild(chipHeader);

  let rateInputBox = createHtmlElement("div", "float-left sixty-width", null, null, null);
  exchangeCardChip.appendChild(rateInputBox);
  let rateInputHeader = createHtmlElement("div", "input-header", null, null, "Rate Per Gram");
  rateInputBox.appendChild(rateInputHeader);
  let rateInputText = createHtmlElement("input", "rate-per-gram input-text rupee-background", null, null, null);
  rateInputText.type = "text";
  rateInputText.style.width = "100%";
  rateInputBox.appendChild(rateInputText);

  let purityInputBox = createHtmlElement("div", "float-right forty-width", null, null, null);
  exchangeCardChip.appendChild(purityInputBox);
  let purityInputHeader = createHtmlElement("div", "input-header align-right", null, null, "Percentage");
  purityInputBox.appendChild(purityInputHeader);
  let purityInputText = createHtmlElement("input", "purity-percentage input-text percentage-background align-right float-right", null, null, null);
  purityInputText.type = "text";
  purityInputText.style.width = "100%";
  purityInputBox.appendChild(purityInputText);

  return exchangeCardChip;
}

function populateRateFields(metal, exchangeCard, weightInput,
  sellRateInput, sellPercentagePurityInput, purchaseRateInput, purchasePercentagePurityInput) {
    let tabIndex = getTabIndexFromId(exchangeCard.parentElement.id);
    let metaData = getMetaData(tabIndex);
    let todaysRate = metaData == null || metaData.sellingRate == null ||
      metaData.sellingRate[metal] == null ? Dao.getTodaysRate()[metal] : metaData.sellingRate[metal];

    weightInput.value = ""
    sellRateInput.value = todaysRate;
    sellPercentagePurityInput.value = "";
    purchaseRateInput.value = metaData == null || metaData.sellingRate == null ||
      metaData.purchaseRate[metal] == null ? ShopCalculator.calculateMetalPurchaseRate(
        Number(todaysRate), Dao.getPurchaseRateDiff()[metal]) : metaData.purchaseRate[metal];
    purchasePercentagePurityInput.value = "";
}

function updatePurchasePrice(exchangeCard, weight, metalRate, purityPercentage) {
  let purchasePrice = 0;
  if (!isNaN(weight) && !isNaN(purityPercentage)) {
    purchasePrice = Math.round(metalRate * weight * purityPercentage * 0.01);
  }

  if (purchasePrice == 0 && exchangeCard.classList.contains("exchange-card-selected")) {
    exchangeCard.classList.remove("exchange-card-selected");
  } else if (purchasePrice != 0) {
    exchangeCard.classList.add("exchange-card-selected");
  }

  let purchasePriceLabel = exchangeCard.querySelector(".exchange-card-label");
  purchasePriceLabel.innerHTML = decodeURI("&#8377;") + " " + getDesiNumber(purchasePrice);

  return purchasePrice;
}

function calculateImpliedPurity(purchasePrice, weight, ratePerGram) {
  if (isNaN(weight) || weight == 0 ||
    isNaN(ratePerGram) || ratePerGram == 0 ||
    isNaN(purchasePrice) || purchasePrice == 0) {
      return ''
  }

  return (purchasePrice * 100 / (weight * ratePerGram)).toFixed(2);
}

/* Net total display */
function buildNetTotalContainer(tabContent, set) {
  let tabIndex = getTabIndexFromId(tabContent.id);

  let netTotalContainer = createHtmlElement("div", "full-tray-container", "net-total-display-container-" + tabIndex, null, null);
  tabContent.appendChild(netTotalContainer);

  let trayControlsContainer = createHtmlElement("div", "tray-controls-container", null, null, null);
  netTotalContainer.appendChild(trayControlsContainer);
  let backButton =
    createHtmlElement("button", "tray-window-button controller-button back-button float-left", "back-button-" + tabIndex, null, null);
  trayControlsContainer.appendChild(backButton);
  let billButton = createHtmlElement("button", "tray-window-button controller-button bill-button float-left", "bill-button-" + tabIndex, null, null);
  billButton.addEventListener("click", () => {
    generateBill(getTabButton(tabIndex).textContent.slice(0, -1), new Date(), ".................",
      parseTable(document.getElementById("sales-table-" + tabIndex)),
      parseTable(document.getElementById("purchase-table-" + tabIndex)),
      getAdditionalCharge(tabIndex), getTotals(tabIndex), false);
  });
  trayControlsContainer.appendChild(billButton);
  let netTotalDisplay = createHtmlElement(
    "div", "total-price-display number-font money-green float-right align-right", "net-total-display-" + tabIndex, null, decodeURI("&#8377;") + " 0");
  trayControlsContainer.appendChild(netTotalDisplay);
  let proceedButton =
    createHtmlElement("button", "tray-window-button finish-transaction-button float-right", "finish-transaction-button-" + tabIndex, "Payment", null);
  trayControlsContainer.appendChild(proceedButton);

  let fullWindowContainer = createHtmlElement("div", "net-windows-wrapper", null, null, null);
  netTotalContainer.appendChild(fullWindowContainer);

  let leftWrapperDiv = createHtmlElement("div", "wrapper-div half-width float-left", null, null, null);
  fullWindowContainer.appendChild(leftWrapperDiv);
  let rightWrapperDiv = createHtmlElement("div", "wrapper-div half-width float-right", null, null, null);
  fullWindowContainer.appendChild(rightWrapperDiv);

  let salesWindowDiv = createHtmlElement("div", "sales-window net-window-div table-header-color gold-inner-shadow", null, null, null);
  leftWrapperDiv.appendChild(salesWindowDiv);
  let salesLabel = createHtmlElement("div", "input-header large-font float-left", null, null, "Sales");
  salesWindowDiv.appendChild(salesLabel);
  let salesTotal = createHtmlElement("div", "large-font align-right", "sales-total-" + tabIndex, null, "₹ 0");
  salesWindowDiv.appendChild(salesTotal);
  let salesTable = createHtmlElement("table", "sales-table", "sales-table-" + tabIndex, null, null);
  salesWindowDiv.appendChild(salesTable);
  addTableHeader(salesTable, ["Metal", "Item", "Weight", "Rate", "Making", "Price", "Grade"]);


  let totalDetailsDiv = createHtmlElement("div", "total-window net-window-div table-header-color gold-inner-shadow", null, null, null);
  rightWrapperDiv.appendChild(totalDetailsDiv);
  let discountDiv = createHtmlElement("div", "wrapper-div half-width float-left", null, null, null);
  totalDetailsDiv.appendChild(discountDiv);
  let totalLabel = createHtmlElement("div", "input-header large-font", null, null, "Total Breakup");
  discountDiv.appendChild(totalLabel);
  let breakupDiv = createHtmlElement("div", "wrapper-div half-width float-right", null, null, null);
  totalDetailsDiv.appendChild(breakupDiv);

  let additionalChargeInputBox = createHtmlElement("div", "wrapper-div table-top-label", null, null, null);
  discountDiv.appendChild(additionalChargeInputBox);
  let additionalChargeInputHeader = createHtmlElement("div", "input-header", null, null, "Other Accessories");
  additionalChargeInputBox.appendChild(additionalChargeInputHeader);
  let additionalChargeInputText = createHtmlElement("input", "discount-input input-text rupee-background", "additional-charge-input-" + tabIndex, null, null);
  additionalChargeInputText.type = "text";
  additionalChargeInputText.style.width = "200px";
  additionalChargeInputText.addEventListener('keyup', function() {
    updateAdditionalCharges(tabIndex);
    updateNetTotalPrice(tabIndex);
  });
  additionalChargeInputBox.appendChild(additionalChargeInputText);

  let discountInputBox = createHtmlElement("div", "wrapper-div table-top-label", null, null, null);
  discountDiv.appendChild(discountInputBox);
  let discountInputHeader = createHtmlElement("div", "input-header", null, null, "Discount Applied");
  discountInputBox.appendChild(discountInputHeader);
  let discountInputText = createHtmlElement("input", "discount-input input-text rupee-background", "discount-input-" + tabIndex, null, null);
  discountInputText.type = "text";
  discountInputText.style.width = "200px";
  discountInputText.addEventListener('keyup', function() {
    updateAdditionalCharges(tabIndex);
    updateNetTotalPrice(tabIndex);
  });
  discountInputBox.appendChild(discountInputText);

  let discountChartButton = createHtmlElement("div", "discount-chart-button", null, null, "Discount Chart");
  discountChartButton.addEventListener("click", function() {
    let content = this.nextElementSibling;
    let discountChartState = this.querySelector(".discount-chart-state");
    if (content.style.display === "block"){
      content.style.display = "none";
      discountChartState.innerHTML = decodeURI("&#x25B6;");
    } else {
      content.style.display = "block";
      discountChartState.innerHTML = decodeURI("&#x25BC;");
    }
  });
  discountDiv.appendChild(discountChartButton);
  let discountChartState = createHtmlElement("span", "float-right discount-chart-state", null, null, decodeURI("&#x25B6;"));
  discountChartButton.appendChild(discountChartState);
  let discountChartContent = createHtmlElement("div", "discount-chart-content", null, null, null);
  discountDiv.appendChild(discountChartContent);
  let discountChart = createHtmlElement("table", "discount-chart", "discount-chart-" + tabIndex, null, null);
  discountChartContent.appendChild(discountChart);
  addTableHeader(discountChart, ["Gr", "Discount Against"]);

  let breakupSalesTotal = createHtmlElement("h1", "number-font money-green align-right", "breakup-sales-total-" + tabIndex, null, "₹ 0");
  breakupDiv.appendChild(breakupSalesTotal);
  let breakupPurchaseTotal = createHtmlElement("h2", "number-font red-color align-right", "breakup-purchase-total-" + tabIndex, null, "- ₹ 0");
  breakupDiv.appendChild(breakupPurchaseTotal);
  let hrWrapperDiv = createHtmlElement("div", "wrapper-div", null, null, null);
  breakupDiv.appendChild(hrWrapperDiv);
  let hrDivide = createHtmlElement("hr", "breakup-divide float-right", null, null, null);
  hrWrapperDiv.appendChild(hrDivide);
  let breakupNetTotal = createHtmlElement("h2", "number-font money-green align-right", "breakup-net-total-" + tabIndex, null, "₹ 0");
  breakupDiv.appendChild(breakupNetTotal);
  let additionalChargeTotal = createHtmlElement("h2", "number-font money-green align-right", "additional-charge-total-" + tabIndex, null, "₹ 0");
  breakupDiv.appendChild(additionalChargeTotal);
  let discountTotal = createHtmlElement("h2", "number-font red-color align-right", "discount-total-" + tabIndex, null, "- ₹ 0");
  breakupDiv.appendChild(discountTotal);


  let purchaseWindowDiv = createHtmlElement("div", "purchase-window net-window-div table-header-color gold-inner-shadow", null, null, null);
  rightWrapperDiv.appendChild(purchaseWindowDiv);
  let purchaseLabel = createHtmlElement("div", "input-header large-font float-left", null, null, "Purchase");
  purchaseWindowDiv.appendChild(purchaseLabel);
  let purchaseTotal = createHtmlElement("div", "large-font align-right", "purchase-total-" + tabIndex, null, "₹ 0");
  purchaseWindowDiv.appendChild(purchaseTotal);
  let purchaseTable = createHtmlElement("table", "purchase-table", "purchase-table-" + tabIndex, null, null);
  purchaseWindowDiv.appendChild(purchaseTable);
  addTableHeader(purchaseTable, ["Metal", "Weight", "Purchase Rate", "Percentage", "Price"]);

  return netTotalContainer;
}

function populateNetTotalContainer(tabIndex) {
  let salesItems = getSelectedSalesItems(tabIndex);
  let salesTable = document.getElementById("sales-table-" + tabIndex);
  emptyTable(salesTable);
  for (let i=0; i<salesItems.length; i++) {
    let salesItem = salesItems[i];
    let color = salesItem.metal === "Gold" ? "gold" : "silver";
    let tableDataElements = [];
    tableDataElements.push(
      wrapTableData(color, document.createTextNode(salesItem.metal)));
    tableDataElements.push(
      wrapTableData(color, document.createTextNode(salesItem.itemName)));
    tableDataElements.push(
      wrapTableData(color, document.createTextNode(salesItem.weight + " g")));
    tableDataElements.push(
      wrapTableData(color, document.createTextNode("₹ " + getDesiNumber(salesItem.ratePerGram) + " /g")));
    tableDataElements.push(
      wrapTableData(color, document.createTextNode("₹ " + (salesItem.making == salesItem.minimumMakingCharge
        ? getDesiNumber(salesItem.minimumMakingCharge) : getDesiNumber(salesItem.makingPerGram) + " /g"))));
    tableDataElements.push(
      wrapTableData(color, document.createTextNode("₹ " + getDesiNumber(salesItem.price))));
    tableDataElements.push(
      wrapTableData(color, document.createTextNode(salesItem.appliedPriceGrade)));
    addTableData(salesTable, tableDataElements);
  }

  let purchaseItems = getExchangeItems(tabIndex);
  let purchaseTable = document.getElementById("purchase-table-" + tabIndex);
  emptyTable(purchaseTable);
  for (let i=0; i<purchaseItems.length; i++) {
    let purchaseItem = purchaseItems[i];
    let color = purchaseItem.metal === "Gold" ? "gold" : "silver";
    let tableDataElements = [];
    tableDataElements.push(
      wrapTableData(color, document.createTextNode(purchaseItem.metal)));
    tableDataElements.push(
      wrapTableData(color, document.createTextNode(purchaseItem.weight + " g")));
    tableDataElements.push(
      wrapTableData(color, document.createTextNode("₹ " + getDesiNumber(purchaseItem.metalPurchaseRate) + " /g")));
    tableDataElements.push(
      wrapTableData(color, document.createTextNode(purchaseItem.purchaseRatePurity + " %")));
    tableDataElements.push(
      wrapTableData(color, document.createTextNode("₹ " + getDesiNumber(purchaseItem.price))));
    addTableData(purchaseTable, tableDataElements);
  }

  populateTotals(tabIndex, salesItems, purchaseItems);
}

function populateTotals(tabIndex, salesItems, purchaseItems) {

  // populate sales totals
  let salesTotal = 0;
  let salesGradesTotal = {};
  let salesGrades = Dao.getGradesList();
  for (let i=0; i<salesGrades.length; i++) {
    salesGradesTotal[salesGrades[i]] = 0;
  }
  for (let i=0; i<salesItems.length; i++) {
    let salesItem = salesItems[i];
    salesTotal = salesTotal + salesItem.price;
    for (let j=0; j<salesItem.grades.length; j++) {
      salesGradesTotal[salesItem.grades[j]] =
        salesGradesTotal[salesItem.grades[j]] + salesItem.gradePrices[salesItem.grades[j]];
    }
  }

  document.getElementById("sales-total-" + tabIndex).innerHTML = "₹ " + getDesiNumber(salesTotal);
  document.getElementById("breakup-sales-total-" + tabIndex).innerHTML = "₹ " + getDesiNumber(salesTotal);

  // populate discount chart
  let discountChart = document.getElementById("discount-chart-" + tabIndex);
  emptyTable(discountChart);
  for (let i=0; i<salesGrades.length; i++) {
    let discount = salesTotal - salesGradesTotal[salesGrades[i]];
    if (discount > 10) {
      addTableData(discountChart, [
        wrapTableData("gold", document.createTextNode(salesGrades[i])),
        wrapTableData("gold", document.createTextNode("₹ " + getDesiNumber(discount)))]);
    }
  }

  // populate purchase totals
  let purchaseTotal = 0;
  for (let i=0; i<purchaseItems.length; i++) {
    let purchaseItem = purchaseItems[i];
    purchaseTotal = purchaseTotal + purchaseItem.price;
  }

  document.getElementById("purchase-total-" + tabIndex).innerHTML = "₹ " + getDesiNumber(purchaseTotal);
  document.getElementById("breakup-purchase-total-" + tabIndex).innerHTML = "- ₹ " + getDesiNumber(purchaseTotal);

  // populate net totals
  let netTotal = salesTotal - purchaseTotal;
  let breakupNetTotal = document.getElementById("breakup-net-total-" + tabIndex);
  if (netTotal < 0) {
    if (breakupNetTotal.classList.contains("money-green")) {
      breakupNetTotal.classList.remove("money-green");
    }
    breakupNetTotal.classList.add("red-color");
    breakupNetTotal.innerHTML = "- ₹ " + getDesiNumber(Math.abs(netTotal));
  } else {
    if (breakupNetTotal.classList.contains("red-color")) {
      breakupNetTotal.classList.remove("red-color");
    }
    breakupNetTotal.classList.add("money-green");
    breakupNetTotal.innerHTML = "₹ " + getDesiNumber(netTotal);
  }

  updateNetTotalPrice(tabIndex);
}

/* Meta Data container */
function buildMetaDataContainer(tabContent, set) {
  let tabIndex = getTabIndexFromId(tabContent.id);

  let metaDataContainer = createHtmlElement("div", "full-tray-container", "meta-data-container-" + tabIndex, null, null);
  tabContent.appendChild(metaDataContainer);
  populateMetaData(metaDataContainer, set);
}

function populateMetaData(metaDataContainer, set) {
  createMetaDataDiv(metaDataContainer, "goldRate", "data-gold-rate", set);
  createMetaDataDiv(metaDataContainer, "silverRate", "data-silver-rate", set);
  createMetaDataDiv(metaDataContainer, "goldPurchaseRate", "data-gold-purchase-rate", set);
  createMetaDataDiv(metaDataContainer, "silverPurchaseRate", "data-silver-purchase-rate", set);
}

function createMetaDataDiv(metaDataContainer, dataName, className, set) {
  let tabIndex = getTabIndexFromId(metaDataContainer.id);

  if (set[dataName] != null) {
    let dataDiv = document.getElementById(className + "-" + tabIndex);
    if (dataDiv != null) {
      dataDiv.remove();
    }

    dataDiv = createHtmlElement("div", "data-div", className + "-" + tabIndex, null, "" + set[dataName]);
    metaDataContainer.appendChild(dataDiv);
  }
}

function getMetaData(tabIndex) {
  let metaData = {
    sellingRate: {},
    purchaseRate: {}
  };

  if (document.getElementById("data-gold-rate-" + tabIndex) != null) {
    metaData.sellingRate["Gold"] = document.getElementById("data-gold-rate-" + tabIndex).innerHTML;
  }

  if (document.getElementById("data-silver-rate-" + tabIndex) != null) {
    metaData.sellingRate["Silver"] = document.getElementById("data-silver-rate-" + tabIndex).innerHTML;
  }

  if (document.getElementById("data-gold-purchase-rate-" + tabIndex) != null) {
    metaData.purchaseRate["Gold"] = document.getElementById("data-gold-purchase-rate-" + tabIndex).innerHTML;
  }

  if (document.getElementById("data-silver-purchase-rate-" + tabIndex) != null) {
    metaData.purchaseRate["Silver"] = document.getElementById("data-silver-purchase-rate-" + tabIndex).innerHTML;
  }

  return metaData;
}

/* Helper methods */

function selectTrayContainer(tabIndex, trayContainer) {
  let selectedTrayContainers = document.getElementsByClassName("full-tray-container-selected");
  for(let i=0; i<selectedTrayContainers.length; i++) {
    if (getTabIndexFromId(selectedTrayContainers[i].id) == parseInt(tabIndex)) {
      selectedTrayContainers[i].classList.remove("full-tray-container-selected");
    }
  }

  trayContainer.classList.add("full-tray-container-selected");
}

function getSelectedSalesItems(tabIndex) {
  let selectedItemsList = [];
  let sellTrayContainer = document.getElementById("sell-tray-container-" + tabIndex);
  let priceCardBoxes = sellTrayContainer.getElementsByClassName("price-card-box");
  let gradeMakingRateDiff = Dao.getGradeMakingRateDiff();
  let gradesList = Dao.getGradesList();
  for (let i=0; i<priceCardBoxes.length; i++) {
    let priceCardBox = priceCardBoxes[i];
    let itemInfoCard = priceCardBox.querySelector(".item-info-card");
    let selectedPriceCards = priceCardBox.getElementsByClassName("price-card-selected");
    for (let j=0; j<selectedPriceCards.length; j++) {
      let selectedPriceCard = selectedPriceCards[j];
      let item = {
        "weight": parseFloat(selectedPriceCard.querySelector(".item-label").textContent),
        "price": getFromDesiRupeeNumber(selectedPriceCard.querySelector(".money-green").textContent),
        "making": getFromDesiRupeeNumber(selectedPriceCard.querySelector(".making-charge").textContent)
      };
      item = getCurentItem(item, itemInfoCard);
      item.grades = gradesList;
      item.gradePrices = {};
      for (let i=0; i<item.grades.length; i++) {
        let grade = item.grades[i];
        item.gradePrices[grade] = ShopCalculator.calculateGardePrice(item.weight, item.ratePerGram,
          item.makingPerGram, item.minimumMakingCharge, Dao.getMappedItem([item.metal, item.itemName].toString()).APPLIED,
          gradeMakingRateDiff[item.appliedPriceGrade][item.metal], gradeMakingRateDiff[grade][item.metal]);
      }

      selectedItemsList.push(item);
    }
  }

  return selectedItemsList;
}

function getExchangeItems(tabIndex) {
  let exchangeItemsList = [];
  let exchangeTrayContainer = document.getElementById("exchange-tray-container-" + tabIndex);
  let exchangePriceCards = exchangeTrayContainer.getElementsByClassName("exchange-price-card");
  for (let i=0; i<exchangePriceCards.length; i++) {
    let exchangePriceCard = exchangePriceCards[i];
    let exchangItem = getCurrentExchangeItem(exchangePriceCard);
    if (exchangItem.price > 0) {
      exchangeItemsList.push(exchangItem);
    }
  }

  return exchangeItemsList;
}

function getCurentItem(item, itemInfoCard) {
  let currentItem = {...item};
  currentItem.metal = itemInfoCard.classList.contains("gold-color") ? "Gold" : "Silver";
  currentItem.itemName = itemInfoCard.querySelector(".item-label").textContent;
  currentItem.ratePerGram = getFromDesiRupeeNumber(itemInfoCard.querySelector(".metal-rate").textContent.replace(" /g", ""));
  currentItem.makingPerGram = getFromDesiRupeeNumber(itemInfoCard.querySelector(".making-rate").textContent.replace(" /g", ""));
  currentItem.minimumMakingCharge = getFromDesiRupeeNumber(itemInfoCard.querySelector(".min-making-charge").textContent);
  currentItem.tabIndex = getTabIndexFromId(itemInfoCard.id);
  currentItem.appliedPriceGrade = getAppliedPriceGrade(currentItem.tabIndex);
  return currentItem;
}

function getCurrentExchangeItem(exchangePriceCard) {
  let sellPriceChip = exchangePriceCard.querySelector(".sell-price-chip");
  let purchasePriceChip = exchangePriceCard.querySelector(".purchase-price-chip");
  let exchangeItem = {
    "price": getFromDesiRupeeNumber(exchangePriceCard.querySelector(".exchange-card-label").textContent),
    "weight": Number(exchangePriceCard.querySelector(".weight-input").value),
    "metal": exchangePriceCard.classList.contains("gold-color") ? "Gold" : "Silver",
    "metalSellingRate": Number(sellPriceChip.querySelector(".rate-per-gram").value),
    "sellingRatePurity": Number(sellPriceChip.querySelector(".purity-percentage").value),
    "metalPurchaseRate": Number(purchasePriceChip.querySelector(".rate-per-gram").value),
    "purchaseRatePurity": Number(purchasePriceChip.querySelector(".purity-percentage").value)
  };

  return exchangeItem;
}

function getAdditionalCharge(tabId) {
  return Number(document.getElementById("additional-charge-input-" + tabId).value);
}

function getAppliedDiscount(tabId) {
  return Number(document.getElementById("discount-input-" + tabId).value);
}

function calculateTotalSalesPrice(tabId) {
  let totalPrice = 0;
  let trayContainer = document.getElementById(getIdString("sell-tray-container-" + tabId));
  let selectedPriceCards = trayContainer.getElementsByClassName("price-card-selected");
  for(let i=0; i<selectedPriceCards.length; i++) {
    totalPrice = totalPrice +
      parseFloat(selectedPriceCards[i].querySelector(".money-green").textContent.replace(/,/g,"").substring(2));
  }

  return totalPrice;
}

function updateTotalSalesPrice(tabId) {
  document.getElementById("total-price-display-" + tabId).innerHTML =
    decodeURI("&#8377;") + " " + getDesiNumber(calculateTotalSalesPrice(tabId));
}

function calculateTotalPurchasePrice(tabId) {
  let totalPurchasePrice = 0;
  let trayContainer = document.getElementById(getIdString("exchange-tray-container-" + tabId));
  let exchangePriceLabels = trayContainer.getElementsByClassName("exchange-card-label");
  for(let i=0; i<exchangePriceLabels.length; i++) {
    totalPurchasePrice = totalPurchasePrice +
      parseFloat(exchangePriceLabels[i].textContent.replace(/,/g,"").substring(2));
  }

  return totalPurchasePrice;
}

function updateTotalPurchasePrice(tabId) {
  document.getElementById("total-purchase-price-display-" + tabId).innerHTML =
    decodeURI("&#8377;") + " " + getDesiNumber(calculateTotalPurchasePrice(tabId));
}

function updateNetTotalPrice(tabId) {
  let salesTotal = getFromDesiRupeeNumber(document.getElementById("sales-total-" + tabId).textContent);
  let purchaseTotal = getFromDesiRupeeNumber(document.getElementById("purchase-total-" + tabId).textContent);
  let appliedDiscount = getAppliedDiscount(tabId);
  let additionalCharge = getAdditionalCharge(tabId);
  let netTotal = salesTotal - purchaseTotal + additionalCharge - appliedDiscount;
  let netTotalDisplay = document.getElementById("net-total-display-" + tabId);
  if (netTotal < 0) {
    if (netTotalDisplay.classList.contains("money-green")) {
      netTotalDisplay.classList.remove("money-green");
    }
    netTotalDisplay.classList.add("red-color");
    netTotalDisplay.innerHTML = "- ₹ " + getDesiNumber(Math.abs(netTotal));
  } else {
    if (netTotalDisplay.classList.contains("red-color")) {
      netTotalDisplay.classList.remove("red-color");
    }
    netTotalDisplay.classList.add("money-green");
    netTotalDisplay.innerHTML = "₹ " + getDesiNumber(netTotal);
  }
}

function updateAdditionalCharges(tabId) {
  document.getElementById("additional-charge-total-" + tabId).innerHTML = "₹ " + getDesiNumber(getAdditionalCharge(tabId));
  document.getElementById("discount-total-" + tabId).innerHTML = "-₹ " + getDesiNumber(getAppliedDiscount(tabId));
}

function getOtherTransactionEntry(price) {
  return price>0 ? [{"Price": price}] : [];
}

function getSalesRateKey(entry) {
  let entryKey = [entry.Metal, entry.Rate_Per_Gram, entry.Making_Per_Gram, entry.Making];
  if (entry.Item.startsWith("Fancy") || entry.Item.startsWith("Dulhan")) {
    entryKey.push(entry.Item);
  }

  return entryKey;
}

function groupBySalesRateKey(aggregatedSalesMap) {
  groupMap = new Map();
  for (let entry of aggregatedSalesMap.values()) {
    let salesRateKey = getSalesRateKey(entry).toString();
    if (groupMap.has(salesRateKey)) {
      let groupEntry = groupMap.get(salesRateKey);
      groupEntry.items.push(entry);
    } else {
      groupMap.set(salesRateKey, {...entry, items: [entry]})
    }
  }

  return Array.from(groupMap.values());
}

function getSalesEntryKey(entry) {
  let entryKey = getSalesRateKey(entry);
  entryKey.push(entry.Item);
  return entryKey;
}

function aggregateSalesEntries(salesEntries) {
  let aggregatedSalesMap = new Map();
  for (let entry of salesEntries) {
    let salesEntryKey = getSalesEntryKey(entry).toString();
    if (aggregatedSalesMap.has(salesEntryKey)) {
      let aggregateEntry = aggregatedSalesMap.get(salesEntryKey);
      aggregateEntry.ItemNames.push(entry.Item);
      aggregateEntry.Weight_In_Gram += entry.Weight_In_Gram;
      aggregateEntry.Weights.push(entry.Weight_In_Gram);
      aggregateEntry.Price += entry.Price;
      aggregateEntry.Quantity += 1;
    } else {
      salesEntry = {...entry, Quantity: 1, ItemNames: [entry.Item], Weights: [entry.Weight_In_Gram]}
      aggregatedSalesMap.set(salesEntryKey, salesEntry);
    }
  }

  return groupBySalesRateKey(aggregatedSalesMap);
}

function aggregateItemNames(itemNames) {
  let itemNamesMap = new Map();
  for (let itemName of itemNames) {
    if (itemName == "Fancy") {
      itemName = itemName + " " + (
        Dao.getMappedItem(["Silver", itemName].toString()).APPLIED * 1000);
    }

    if (itemNamesMap.has(itemName)) {
      let itemNameEntry = itemNamesMap.get(itemName);
      itemNameEntry.count += 1;
    } else {
      itemNamesMap.set(itemName, {"count": 1});
    }
  }

  return itemNamesMap;
}

function generateBill(tabName, date, transId,
  salesEntries, purchaseEntries, additionalCharge, totals, savable) {
    if (salesEntries.length == 0 && purchaseEntries.length == 0 && additionalCharge == 0) {
      // remote.dialog.showMessageBox(remote.getCurrentWindow(), {
      //   type: 'error',
      //   buttons: ['Ok'],
      //   defaultId: 0,
      //   title: 'No item selected',
      //   message: 'Cannot generate empty bill!!',
      //   detail: 'Please select items to complete this transaction'
      // });
      alert('No item selected. Please select items to complete this transaction.');
    } else {
      ipcRenderer.send('bill:create', {
        name: tabName,
        bill_date: formatDateSlash(date),
        bill_date_reverse: formatDateReverse(date),
        id: transId,
        sales: aggregateSalesEntries(salesEntries),
        purchase: purchaseEntries,
        additional: additionalCharge,
        totals: totals,
        savable: savable
      });
    }
}

function finishTransaction(tabId, additionalConfigs) {
  let date = new Date();
  let tabButton = getTabButton(tabId);
  let tabName = tabButton.textContent.slice(0, -1);
  let transId = generateTransactionId(date);
  let totalDiscount = getAppliedDiscount(tabId);
  if (additionalConfigs.markAs === "Discount") {
    totalDiscount += additionalConfigs.pending;
  }

  // transaction entries
  let salesEntries = parseTable(document.getElementById("sales-table-" + tabId));
  let purchaseEntries = parseTable(document.getElementById("purchase-table-" + tabId));
  let additionalChargeEntry = getOtherTransactionEntry(getAdditionalCharge(tabId));
  let discountEntry = getOtherTransactionEntry(totalDiscount);

  // enrich transaction entries
  enrichTransactionEntries(salesEntries, transId, date, tabName, "Sales");
  enrichTransactionEntries(purchaseEntries, transId, date, tabName, "Purchase");
  enrichTransactionEntries(additionalChargeEntry, transId, date, tabName, "Sales Extra");
  enrichTransactionEntries(discountEntry, transId, date, tabName, "Discount");

  // other transaction entries e.g. due, return
  let allTransactionEntries = [salesEntries, purchaseEntries, additionalChargeEntry, discountEntry];
  if (additionalConfigs.markAs != null) {
    if (additionalConfigs.markAs !== "Discount") {
      let otherEntry = getOtherTransactionEntry(additionalConfigs.pending);
      enrichTransactionEntries(otherEntry, transId, date, tabName, additionalConfigs.markAs);
      allTransactionEntries.push(otherEntry);
    }
  }

  // persist transaction entries
  if (salesEntries.length == 0 && purchaseEntries.length == 0
    && additionalChargeEntry.length == 0) {
      // remote.dialog.showMessageBox(remote.getCurrentWindow(), {
      //   type: 'error',
      //   buttons: ['Ok'],
      //   defaultId: 0,
      //   title: 'No item selected',
      //   message: 'Cannot complete empty transaction!!',
      //   detail: 'Please select items to mark this transaction complete'
      // });
      alert('No item selected. Please select items to complete this transaction.');
  } else {
    Dao
      .persistTransactionEntries(date, consolidateEntries(allTransactionEntries))
      .then(() => {
          alert('Finished transaction for ' + tabName + '!!');

          // bill totals
          let billTotals = getTotals(tabId);
          billTotals.pending_as = additionalConfigs.markAs;
          billTotals.paid_amount = "₹ " + getDesiNumber(additionalConfigs.paid);
          billTotals.pending_amount = "₹ " + getDesiNumber(additionalConfigs.pending);
          billTotals.discount = "₹ " + getDesiNumber(totalDiscount);
          if (billTotals.pending_as === "Discount") {
            // update total bill when discount is updated
            billTotals.total_bill = billTotals.paid_amount;
          }

          // generate bills
          generateBill(tabName, date, transId, salesEntries, purchaseEntries,
            getAdditionalCharge(tabId), billTotals, false);

          // finally close the tab
          closeTab(tabButton);
        });
  }
}

function getTotals(tabId) {
  let salesTotal = getAdditionalCharge(tabId) +
    getFromDesiRupeeNumber(document.getElementById("breakup-sales-total-" + tabId).innerHTML);

  let subTotalVal = document.getElementById("breakup-net-total-" + tabId).innerHTML;
  let subTotal = getAdditionalCharge(tabId) + (subTotalVal.startsWith("- ₹") ?
    -1 * getFromDesiRupeeNumber(subTotalVal.substring(2)) : getFromDesiRupeeNumber(subTotalVal));

  return {
    sales: "₹ " + getDesiNumber(salesTotal),
    purchase: document.getElementById("breakup-purchase-total-" + tabId).innerHTML,
    sub_total: (subTotal < 0 ? "- ₹ " : "₹ ") + getDesiNumber(Math.abs(subTotal)),
    discount: "₹ " + getDesiNumber(getAppliedDiscount(tabId)),
    total_bill: document.getElementById("net-total-display-" + tabId).innerHTML
  }
}

function enrichTransactionEntries(
  transEntries, transId, transDate, transName, transType) {
    let transDateText = formatDate(transDate);
    for (let i=0; i<transEntries.length; i++) {
      transEntries[i]["Transaction_Id"] = transId;
      transEntries[i]["Name"] = transName;
      transEntries[i]["Date"] = transDateText;
      transEntries[i]["Type"] = transType;
    }
}

function getAppliedPriceGrade(tabIndex) {
  return document.getElementById("applied-price-grade-" + tabIndex).textContent;
}

function wrapTableData(color, element) {
  let tableData = createHtmlElement("div", "table-data-div " + color + "-color", null, null, null);
  tableData.appendChild(element);
  return tableData;
}

function getItemColorCode(metal) {
  let colorCode = {
    itemColor: "others-color",
    itemInnerShadow : "others-inner-shadow",
    itemOuterShadow : "others-outer-shadow"
  };
  if (metal === 'Gold') {
    colorCode.itemColor = "gold-color";
    colorCode.itemInnerShadow = "gold-inner-shadow";
    colorCode.itemOuterShadow = "gold-outer-shadow";
  } else if (metal === 'Silver') {
    colorCode.itemColor = "silver-color";
    colorCode.itemInnerShadow = "silver-inner-shadow";
    colorCode.itemOuterShadow = "silver-outer-shadow";
  }

  return colorCode;
}

function getItemType(classList) {
  if (classList.contains("gold-color")) {
    return "Gold";
  } else if (classList.contains("silver-color")) {
    return "Silver";
  }

  return "Others";
}

function getTabButton(tabId) {
  return document.getElementById("tab-button-" + tabId);
}

function getTabName(tabId) {
  return getTabButton(tabId).textContent.slice(0, -1);
}

function selectTab(tabButton) {
  let selectedTabButton = document.querySelector(".tab-button-selected");
  if (selectedTabButton) {
    selectedTabButton.classList.remove("tab-button-selected");
  }
  tabButton.classList.add("tab-button-selected");

  let selectedTabContent = document.querySelector(".tab-content-selected");
  if (selectedTabContent) {
    selectedTabContent.classList.remove("tab-content-selected");
  }

  let newSelectedTabContent = document.getElementById("tab-content-" + getTabIndexFromId(tabButton.id));
  newSelectedTabContent.classList.add("tab-content-selected");
}

function confirmAndCloseTab(tabButton) {
  let tabId = getTabIndexFromId(tabButton.id);
  let sellTrayContainer = document.getElementById("sell-tray-container-" + tabId);
  if(calculateTotalSalesPrice(tabId) != 0) {
    selectTrayContainer(tabId, sellTrayContainer);
    selectTab(tabButton);
    showTransactionInProgressError();
  } else if (sellTrayContainer.getElementsByClassName("price-card-box").length == 0
      && calculateTotalPurchasePrice(tabId) != 0) {
        let exchangeTrayContainer = document.getElementById("exchange-tray-container-" + tabId);
        selectTrayContainer(tabId, exchangeTrayContainer);
        selectTab(tabButton);
        showTransactionInProgressError();
  } else {
    closeTab(tabButton);
  }
}

function closeTab(tabButton) {
  let selectedTabButton = document.querySelector(".tab-button-selected");
  if (selectedTabButton.id === tabButton.id) {
    let neighbouringTabIndex = getPreviousOrNextTabIndex(getTabIndexFromId(tabButton.id));
    if (neighbouringTabIndex == -1) {
      ipcRenderer.send('close:tray', null);
    }
    selectTab(document.getElementById("tab-button-" + neighbouringTabIndex));
  }

  let tabContent = document.getElementById("tab-content-" + getTabIndexFromId(tabButton.id));
  tabContent.remove();
  tabButton.remove();
}

function showTransactionInProgressError() {
  // remote.dialog.showMessageBox(remote.getCurrentWindow(), {
  //   type: 'error',
  //   buttons: ['Ok'],
  //   defaultId: 0,
  //   title: 'Transaction in progress',
  //   message: 'Cannot close this tab!!',
  //   detail: 'Please unselect items or complete this transaction'
  // });
  alert('Please unselect items or complete this transaction');
}

function maxTabIndex() {
  let tabButtons = document.getElementsByClassName("tab-button");
  if (tabButtons.length == 0) {
    return 0;
  }
  return getTabIndexFromId(tabButtons[tabButtons.length - 1].id) + 1;
}

function getPreviousOrNextTabIndex(tabIndex) {
  let prevTabIndex = -1;
  let tabButtons = document.getElementsByClassName("tab-button");
  for (let i=0; i<tabButtons.length; i++) {
    if (getTabIndexFromId(tabButtons[i].id) < tabIndex) {
      prevTabIndex = getTabIndexFromId(tabButtons[i].id);
    }
  }

  if (prevTabIndex == -1 && tabButtons.length > 1) {
    return getTabIndexFromId(tabButtons[1].id);
  }

  return prevTabIndex;
}

function getTabIndexFromId(elementId) {
  let stringList = elementId.split("-");
  return parseInt(stringList[stringList.length-1]);
}

function getItemIdString(className, itemName, tabId) {
  return className + "-" + getIdString(itemName) + "-" + tabId;
}

function getIdString(string) {
  return string.toLowerCase().replace(" ", "-");
}
