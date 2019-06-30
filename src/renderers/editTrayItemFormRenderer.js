const {ipcRenderer, remote} = require("electron");
const {clearSelection, getInputTextFloatValue} = require("./../utils.js");

/* ESC key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 27) {
    window.close();
  }
}

let item = remote.getCurrentWindow().windowItem;
let itemColor = "others-color";
if (item.metal === 'Gold') {
  itemColor = "gold-color";
} else if (item.metal === 'Silver') {
  itemColor = "silver-color";
}

document.querySelector(".form-div").classList.add(itemColor);
document.querySelector(".item-header").textContent = item.itemName;
document.querySelector(".rate-per-gram").querySelector(".input-text").value = item.ratePerGram;
document.querySelector(".making-per-gram").querySelector(".input-text").value = item.makingPerGram;
document.querySelector(".minimum-making").querySelector(".input-text").value = item.minimumMakingCharge;

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
  let updateParams = null;
  let formDataObject = {
    itemName: item.itemName,
    metal: item.metal,
    tabIndex: item.tabIndex
  };

  formDataObject.weightList = [];
  let inputWeights = document.querySelector(".input-weights").value.split('\n');
  for (let j=0; j<inputWeights.length; j++) {
    let weight = Number(inputWeights[j]);
    if (!isNaN(weight) && weight > 0) {
      formDataObject.weightList.push(weight);
    }
  }

  formDataObject.makingPerGram = getInputTextFloatValue(document.querySelector(".making-per-gram"));
  formDataObject.ratePerGram = getInputTextFloatValue(document.querySelector(".rate-per-gram"));
  formDataObject.minimumMakingCharge = getInputTextFloatValue(document.querySelector(".minimum-making"));
  if (!(isNaN(formDataObject.ratePerGram) || isNaN(formDataObject.ratePerGram) || isNaN(formDataObject.minimumMakingCharge))) {
    updateParams = formDataObject;
  }

  ipcRenderer.send('set:item:update', updateParams);
}
