const {ipcRenderer} = require("electron");
/* Add center button event listeners */

/* Sell button listener */
document.getElementById("sell-gold-button").addEventListener("click", () => {
  ipcRenderer.send('open:sell', null);
});

/* Buy button listener */
document.getElementById("buy-gold-button").addEventListener("click", () => {
  ipcRenderer.send('open:buy', null);
});

/* Add item button listener */
document.getElementById("add-price-button").addEventListener("click", () => {
  ipcRenderer.send('open:configs', null);
});
