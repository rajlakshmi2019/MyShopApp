const {ipcRenderer, remote} = require("electron");
const {clearSelection, getFinancialYear, isValidFinancialYear, createHtmlElement, getMonths} = require("./../utils.js");
const Dao = remote.require("./Dao.js");

/* ESC key event handling */
/* NumKey - key event handling */
window.addEventListener('keydown', closeCurrentWindow, true);
function closeCurrentWindow(e) {
  if (e.keyCode == 109 || e.keyCode == 27) {
    window.close();
  }
}

/* Done Button Event Listener */
let submitButton = document.querySelector(".form-submit");
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  window.close();
});
submitButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
  window.close();
});


/* Populate dropdown options */
let financialYearSelect = document.getElementById("financial-year-select");
let dataContents = Dao.getDirectoryContents("").sort().reverse();
dataContents.forEach((item) => {
  if (isValidFinancialYear(item)) {
    let option = createHtmlElement("option", null, null, null, item);
    option.value = item;
    financialYearSelect.appendChild(option);
  }
});
financialYearSelect.addEventListener("change", () => {
  emptyGSTReport();
  populateMonthSelect();
});


let monthSelect = document.getElementById("month-select");
function populateMonthSelect() {
  while(monthSelect.firstChild) {
    monthSelect.removeChild(monthSelect.firstChild);
  }

  let fyStr = financialYearSelect.value;
  let dirFiles = new Set(Dao.getDirectoryContents(fyStr));
  getMonths().forEach((month) => {
    let gstReportFileName = fyStr + "_" + month.substring(0, 3) + "_GST_Report.csv";
    if (dirFiles.has(gstReportFileName)) {
      let option = createHtmlElement("option", null, null, null, month);
      option.value = gstReportFileName;
      monthSelect.appendChild(option);
    }
  });

  monthSelect.selectedIndex = monthSelect.getElementsByTagName("option").length - 1;
}
monthSelect.addEventListener("change", emptyGSTReport);

let generateButton = document.getElementById("generate-report-btn");
generateButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearSelection();
  generateGSTReport();
});
generateButton.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearSelection();
  generateGSTReport();
});

function emptyGSTReport() {
  let reportDataElements = document.getElementById("gst-report-data").getElementsByTagName("td");
  for (let i = 0; i < reportDataElements.length; i++) {
    reportDataElements[i].textContent = "-";
  }
}

function generateGSTReport() {
  Dao.getGSTReportRecords(financialYearSelect.value + "/" + monthSelect.value)
    .then(records => {
      let gstReport = records.reduce((accumulator, record) => {
        Object.keys(accumulator).forEach((key) => {
          if (key in record) {
            accumulator[key] += Number(record[key]);
          }
        });
        return accumulator;
      }, {
        "Taxable Value": 0.00,
        "CGST": 0.00,
        "SGST": 0.00,
        "Total GST": 0.00,
        "Round Off": 0.00,
        "Total Bill": 0.00,
        "Gold Wt": 0.00,
        "Silver Wt": 0.00
      });

      Object.keys(gstReport).forEach((key) => {
        let td = document.getElementById(key.toLowerCase().replace(/ /g, "-") + "-td");
        if (td != null) {
          td.textContent = gstReport[key].toFixed(2);
        }
      });

    }).catch(error => console.log(error));
}

emptyGSTReport();
populateMonthSelect();
generateGSTReport();
