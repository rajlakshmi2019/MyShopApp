const {ipcRenderer, remote} = require("electron");
const {clearSelection} = require("./../utils.js");
const ShopCalculator = require("./../ShopCalculator.js");
const Dao = remote.require("./Dao.js");

/* ESC key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 27) {
    window.close();
  }
}

/* NumKey - key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 109) {
    window.close();
  }
}

/* Resolve metal rate */
let metalRate = remote.getCurrentWindow().sellingMetalRate;
if (metalRate == null) {
  metalRate = Dao.getTodaysRate(Dao);
}

/* Form Populator */
let tabName = remote.getCurrentWindow().tabName;
if (tabName != null) {
  let setNameInput = document.getElementById("set-name");
  setNameInput.value = tabName;
  setNameInput.readOnly = true;
}


/* Type Items Map */
let goldItemsMap = Dao.getGoldItemTypes();
let silverItemsMap = Dao.getSilverItemTypes();

goldItemsMap.forEach((value, key, map) => {
  addItemForms('Gold', key, value);
});

silverItemsMap.forEach((value, key, map) => {
  addItemForms('Silver', key, value);
});

/* Add content for collapsible-option */
function addItemForms(metal, itemType, itemNameList) {
  let content = document.getElementById(metal.toLowerCase() + "-content");

  // collapsible-option button
  let collapsibleOptBtn = document.createElement('button');
  collapsibleOptBtn.className = "collapsible-option collapsible";
  collapsibleOptBtn.textContent = itemType + " ";
  content.appendChild(collapsibleOptBtn);

  let collapsibleOptState = document.createElement('span');
  collapsibleOptState.className = "collapsible-option-state";
  collapsibleOptState.innerHTML = decodeURI("&#x25B6;");
  collapsibleOptBtn.appendChild(collapsibleOptState);

  // collapsible-option-content
  let collapsibleOptContent = document.createElement('div');
  collapsibleOptContent.className = "option-content";
  content.appendChild(collapsibleOptContent);

  let formContent = document.createElement('div');
  formContent.className = "card-inward";
  collapsibleOptContent.appendChild(formContent);

  for(let i=0; i<itemNameList.length; i++) {
    let formDiv = document.createElement('div');
    formDiv.className = "form-div card-outward float-left";
    formContent.appendChild(formDiv);

    let itemName = itemNameList[i];
    let itemHeader = document.createElement('div');
    itemHeader.className = "input-header item-header";
    itemHeader.textContent = itemName;
    formDiv.appendChild(itemHeader);

    let metalHeader = document.createElement('div');
    metalHeader.className = "metal-header display-none";
    metalHeader.textContent = metal;
    formDiv.appendChild(metalHeader);

    let rightFormDiv = document.createElement('div');
    rightFormDiv.className = "wrapper-div";
    let rightInputBox = document.createElement('div');
    rightInputBox.className = "input-box";
    let inputHeaderDiv = document.createElement('div');
    inputHeaderDiv.className = "input-header";
    inputHeaderDiv.textContent = "Weight In Grams";
    rightInputBox.appendChild(inputHeaderDiv);
    let inputTextArea = document.createElement('textarea');
    inputTextArea.className = "input-textarea input-weights";
    inputTextArea.rows = "4";
    rightInputBox.appendChild(inputTextArea);
    rightFormDiv.appendChild(rightInputBox);
    formDiv.appendChild(rightFormDiv);
  }

  let quickSubmitDiv = document.createElement('div');
  quickSubmitDiv.className = "quick-submit";
  formContent.appendChild(quickSubmitDiv);

  let quickSubmitButton = document.createElement('button');
  quickSubmitButton.className = "quick-submit-btn";
  quickSubmitButton.innerHTML = decodeURI("&#x27A1");
  quickSubmitButton.addEventListener('click', (event) => {
    event.preventDefault();
    submitFormData();
    clearSelection();
  });
  quickSubmitDiv.appendChild(quickSubmitButton);

  // add click event listener to collapsible option button
  addCollapsibleClickListener(collapsibleOptBtn, collapsibleOptContent);
}

function addCollapsibleClickListener(collapsibleOptButton, collapsibleOptContent) {
  collapsibleOptButton.addEventListener("click", function() {
    let parentContent = this.parentElement;
    let collapsibleOptState = this.querySelector(".collapsible-option-state");
    if (collapsibleOptContent.style.display === "block"){
      collapsibleOptContent.style.display = "none";
      collapsibleOptState.innerHTML = decodeURI("&#x25B6;");
    } else {
      collapsibleOptContent.style.display = "block";
      collapsibleOptState.innerHTML = decodeURI("&#x25BC;");
    }
    parentContent.style.maxHeight = parentContent.scrollHeight + "px";
  });
}

/* collapsible button logic */
let collapsibles = document.getElementsByClassName("collapsible-main");
for (let i=0; i< collapsibles.length; i++) {
  collapsibles[i].addEventListener("click", function() {
    let content = this.nextElementSibling;
    let collapsibleState = this.querySelector('.collapsible-state');
    if (content.style.maxHeight){
      content.style.maxHeight = null;
      collapsibleState.textContent = "+";
      this.style.borderBottomLeftRadius = "4px";
      this.style.borderBottomRightRadius = "4px";
    } else {
      this.style.borderBottomLeftRadius = "0px";
      this.style.borderBottomRightRadius = "0px";
      content.style.maxHeight = content.scrollHeight + "px";
      collapsibleState.textContent = "-";
    }
  })
}

/* Main rate populator */
let mainGoldRate = document.getElementById("gold-rate-main");
mainGoldRate.value = metalRate["Gold"];

let mainSilverRate = document.getElementById("silver-rate-main");
mainSilverRate.value = metalRate["Silver"];

/* Done Button Event Listener */
let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  submitFormData();
  clearSelection();
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});

function submitFormData() {
  let purchaseRateDiff = Dao.getPurchaseRateDiff();
  let goldRateMain = Number(document.getElementById("gold-rate-main").value);
  let silverRateMain = Number(document.getElementById("silver-rate-main").value);

  let formData = [];
  let formDataContainers = document.getElementsByClassName("form-div");
  for (let i=0; i<formDataContainers.length; i++) {
    let formDataObject = {};
    let formDataContainer = formDataContainers[i];
    let metal = formDataContainer.querySelector(".metal-header").textContent;
    let itemName = formDataContainer.querySelector(".item-header").textContent;

    formDataObject.weightList = [];
    let inputWeights = formDataContainer.querySelector(".input-weights").value.split('\n');
    for (let j=0; j<inputWeights.length; j++) {
      let weight = Number(inputWeights[j]);
      if (!isNaN(weight) && weight > 0) {
        formDataObject.weightList.push(weight);
      }
    }

    if (formDataObject.weightList.length > 0) {
      formDataObject.metal = metal;
      formDataObject.itemName = itemName;
      formDataObject.ratePerGram = (metal === 'Gold') ? goldRateMain : silverRateMain;
      formDataObject.makingPerGram = Dao.getMappedItem([metal, itemName].toString()).MAKING_RATE;
      formDataObject.minimumMakingCharge = Dao.getMappedItem([metal, itemName].toString()).MIN_MAKING;
      if (!(isNaN(formDataObject.ratePerGram) ||
        isNaN(formDataObject.ratePerGram) || isNaN(formDataObject.minimumMakingCharge))) {
          formData.push(formDataObject);
      }
    }
  }

  let setNameElement = document.getElementById("set-name");
  if (setNameElement.value === "" && formData.length > 0) {
    setNameElement.style.borderColor = "red";
    setNameElement.parentElement.scrollIntoView();
    alert("Please Enter Customer Details");
    return;
  }

  let payload = {
    setItems: formData,
    setName: setNameElement.value,
    goldRate: goldRateMain,
    goldPurchaseRate:
      ShopCalculator.calculateMetalPurchaseRate(goldRateMain, purchaseRateDiff.Gold),
    silverRate: silverRateMain,
    silverPurchaseRate:
      ShopCalculator.calculateMetalPurchaseRate(silverRateMain, purchaseRateDiff.Silver),
    tabIndex: remote.getCurrentWindow().tabIndex
  };

  // send submit signal and payload
  ipcRenderer.send('set:create', payload);
}
