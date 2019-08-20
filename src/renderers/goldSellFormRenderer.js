const {ipcRenderer, remote} = require("electron");
const {clearSelection, getInputTextFloatValue} = require("./../utils.js");
const ShopCalculator = require("./../ShopCalculator.js");
const Dao = remote.require("./Dao.js");

/* ESC key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 27) {
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
  let contentElementId = metal.toLowerCase() + "-content";

  // collapsible-option button
  let collapsibleOptBtn = document.createElement('button');
  collapsibleOptBtn.className = "collapsible-option collapsible";
  collapsibleOptBtn.textContent = itemType + " ";

  let collapsibleOptState = document.createElement('span');
  collapsibleOptState.className = "collapsible-option-state";
  collapsibleOptState.innerHTML = decodeURI("&#x25B6;");

  collapsibleOptBtn.appendChild(collapsibleOptState);

  // collapsible-option-content
  let collapsibleOptContent = document.createElement('div');
  collapsibleOptContent.className = "option-content";
  for(let i=0; i<itemNameList.length; i++) {
    let formContent = document.createElement('div');
    formContent.className = "card-inward";
    collapsibleOptContent.appendChild(formContent);

    let formDiv = document.createElement('div');
    formDiv.className = "form-div";
    formContent.appendChild(formDiv);

    let itemName = itemNameList[i];
    let itemHeader = document.createElement('div');
    itemHeader.className = "input-header item-header";
    itemHeader.textContent = itemName;
    formDiv.appendChild(itemHeader);

    let leftFormDiv = document.createElement('div');
    leftFormDiv.className = "split-seventy float-left";
    let leftInputBox1 = createLeftInputBox(
      "input-box split-forty float-left rate-per-gram", "Rate per gram", metalRate[metal]);
    leftFormDiv.appendChild(leftInputBox1);
    let leftInputBox2 = createLeftInputBox("input-box split-half float-left making-per-gram",
      "Making Charge per gram", Dao.getMappedItem([metal, itemName].toString()).MAKING_RATE);
    leftFormDiv.appendChild(leftInputBox2);
    let leftInputBox3 = createLeftInputBox("input-box split-half float-left minimum-making",
      "Minimum Making Charge", Dao.getMappedItem([metal, itemName].toString()).MIN_MAKING);
    leftFormDiv.appendChild(leftInputBox3);
    formDiv.appendChild(leftFormDiv);

    let rightFormDiv = document.createElement('div');
    rightFormDiv.className = "split-thirty float-left";
    let rightInputBox = document.createElement('div');
    rightInputBox.className = "input-box float-right";
    let inputHeaderDiv = document.createElement('div');
    inputHeaderDiv.className = "input-header";
    inputHeaderDiv.textContent = "Weight In Grams";
    rightInputBox.appendChild(inputHeaderDiv);
    let inputTextArea = document.createElement('textarea');
    inputTextArea.className = "input-text input-weights";
    inputTextArea.rows = "5";
    inputTextArea.cols = "20";
    rightInputBox.appendChild(inputTextArea);
    rightFormDiv.appendChild(rightInputBox);
    formDiv.appendChild(rightFormDiv);
  }

  // add click event listener to collapsible option button
  addCollapsibleClickListener(collapsibleOptBtn, collapsibleOptContent);

  // Add collapsible option elements
  let content = document.getElementById(contentElementId);
  content.appendChild(collapsibleOptBtn);
  content.appendChild(collapsibleOptContent);
}

function createLeftInputBox(className, inputHeader, inputValue) {
  let inputBox = document.createElement('div');
  inputBox.className = className;

  let inputHeaderDiv = document.createElement('div');
  inputHeaderDiv.className = "input-header";
  inputHeaderDiv.textContent = inputHeader;
  inputBox.appendChild(inputHeaderDiv);

  let inputText = document.createElement('input');
  inputText.type = "text";
  inputText.className = "input-text rupee-background";
  inputText.value = inputValue;
  inputBox.appendChild(inputText);

  return inputBox;
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
mainGoldRate.addEventListener('keyup', function() {
  let goldContent = document.getElementById("gold-content");
  let goldInputBoxes = goldContent.getElementsByClassName("rate-per-gram");
  for(let i=0; i<goldInputBoxes.length; i++) {
    goldInputBoxes[i].querySelector(".input-text").value = this.value;
  }
});

let mainSilverRate = document.getElementById("silver-rate-main");
mainSilverRate.value = metalRate["Silver"];
mainSilverRate.addEventListener('keyup', function() {
  let silverContent = document.getElementById("silver-content");
  let silverInputBoxes = silverContent.getElementsByClassName("rate-per-gram");
  for(let i=0; i<silverInputBoxes.length; i++) {
    silverInputBoxes[i].querySelector(".input-text").value = this.value;
  }
});

/* Done Button Event Listener */
let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  submitFormData();
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
});

function submitFormData() {
  let formData = [];
  let formDataContainers = document.getElementsByClassName("form-div");
  for (let i=0; i<formDataContainers.length; i++) {
    let formDataObject = {};
    let formDataContainer = formDataContainers[i];

    formDataObject.weightList = [];
    let inputWeights = formDataContainer.querySelector(".input-weights").value.split('\n');
    for (let j=0; j<inputWeights.length; j++) {
      let weight = Number(inputWeights[j]);
      if (!isNaN(weight) && weight > 0) {
        formDataObject.weightList.push(weight);
      }
    }

    if (formDataObject.weightList.length > 0) {
      formDataObject.itemName = formDataContainer.querySelector(".item-header").textContent;
      formDataObject.metal = getItemMetal(formDataObject.itemName);
      formDataObject.ratePerGram = getInputTextFloatValue(formDataContainer.querySelector(".rate-per-gram"));
      formDataObject.makingPerGram = getInputTextFloatValue(formDataContainer.querySelector(".making-per-gram"));
      formDataObject.minimumMakingCharge = getInputTextFloatValue(formDataContainer.querySelector(".minimum-making"));
      if (!(isNaN(formDataObject.ratePerGram) || isNaN(formDataObject.ratePerGram) || isNaN(formDataObject.minimumMakingCharge))) {
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

  let purchaseRateDiff = Dao.getPurchaseRateDiff();
  let goldRateMain = Number(document.getElementById("gold-rate-main").value);
  let silverRateMain = Number(document.getElementById("silver-rate-main").value);
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

function getItemMetal(itemName) {
  let itemsItr = goldItemsMap.values();
  let currentItr = itemsItr.next()
  while(!currentItr.done) {
    if (currentItr.value.includes(itemName)) {
      return 'Gold';
    }
    currentItr = itemsItr.next();
  }

  itemsItr = silverItemsMap.values();
  currentItr = itemsItr.next()
  while(!currentItr.done) {
    if (currentItr.value.includes(itemName)) {
      return 'Silver';
    }
    currentItr = itemsItr.next();
  }

  return 'Others';
}
