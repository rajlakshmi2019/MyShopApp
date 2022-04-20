function clearSelection() {
  if(document.selection && document.selection.empty) {
      document.selection.empty();
  } else if(window.getSelection) {
      var sel = window.getSelection();
      sel.removeAllRanges();
  }
}

function createHtmlElement(elementType, className, id, textContent, innerHTML) {
  let element = document.createElement(elementType);
  if (className) {
    element.className = className;
  }

  if (id) {
    element.id = id;
  }

  if (textContent) {
    element.textContent = textContent;
  }

  if (innerHTML) {
    element.innerHTML = innerHTML;
  }

  return element;
}

function removeElement(element) {
  element.remove();
}

function addTableHeader(table, headers) {
  let trElement = document.createElement("tr");
  table.appendChild(trElement);

  // Add headers
  addColumnHeaders(trElement, headers)

  return trElement;
}

function addTableHeaderWithCheckbox(table, headers) {
  let trElement = document.createElement("tr");
  table.appendChild(trElement);

  // Add headers
  addCheckboxColumn(trElement, "checkbox-header",
  () => {
    checkAllRows(table, true);
  },
  () => {
    checkAllRows(table, false);
  });
  addColumnHeaders(trElement, headers);

  return trElement;
}

function checkAllRows(table, checkValue) {
  tableCheckboxes = table.getElementsByClassName("checkbox-row");
  for (let i=0; i<tableCheckboxes.length; i++) {
    tableCheckboxes[i].checked = checkValue;
    tableCheckboxes[i].dispatchEvent(new Event("change"));
  }
}

function addColumnHeaders(trElement, headers) {
  for (let i=0; i<headers.length; i++) {
    let thElement = document.createElement("th");
    thElement.textContent = headers[i];
    trElement.appendChild(thElement);
  }
}

function addTableData(table, tableDataElements) {
  let trElement = document.createElement("tr");
  trElement.className = "data-row"
  table.appendChild(trElement);

  //Add column data
  addColumnData(trElement, tableDataElements);

  return trElement;
}

function addEquiColumnTableData(table, tableDataElements) {
  let trElement = document.createElement("tr");
  trElement.className = "data-row equi-column"
  table.appendChild(trElement);

  //Add column data
  addColumnData(trElement, tableDataElements);

  return trElement;
}

function addTableDataWithCheckbox(table, tableDataElements, checkboxCallback) {
    let trElement = document.createElement("tr");
    trElement.className = "data-row checked-row"
    table.appendChild(trElement);

    //Add column data
    addCheckboxColumn(trElement, "checkbox-row",
    () => {
      trElement.classList.add("checked-row");
      trElement.classList.remove("unchecked-row");
      checkboxCallback();
    },
    () => {
      trElement.classList.remove("checked-row");
      trElement.classList.add("unchecked-row");
      checkboxCallback();
    });
    addColumnData(trElement, tableDataElements);

    return trElement;
}

function addColumnData(trElement, tableDataElements) {
  for (let i=0; i<tableDataElements.length; i++) {
    let tdElement = document.createElement("td");
    tdElement.appendChild(tableDataElements[i]);
    trElement.appendChild(tdElement);
  }
}

function addCheckboxColumn(trElement, checkboxClassName, callbackIfChecked,
  callbackIfUnchecked) {
    checkbox = document.createElement("input");
    checkbox.className = checkboxClassName;
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.addEventListener("change", function() {
      if (this.checked) {
        callbackIfChecked();
      } else {
        callbackIfUnchecked();
      }
    });

    checkboxDiv = document.createElement("div");
    checkboxDiv.className = "checkbox-div";
    checkboxDiv.appendChild(checkbox);

    trElement.appendChild(checkboxDiv);
}

function emptyTable(table) {
  for (let i = table.rows.length - 1; i > 0; i--) {
    table.deleteRow(i);
  }
}

function emptyTableWithHeader(table) {
  for (let i = table.rows.length - 1; i >= 0; i--) {
    table.deleteRow(i);
  }
}

function unWrapTableData(tableData) {
  return tableData.childNodes[0];
}

function getKeyFromHeader(header, isPerGram) {
  return header.split(' ').join('_') + (isPerGram ? '_Per_Gram' : '');
}

function parseTable(table, checkedOnly) {
  let headers = [];
  let headerElements = table.getElementsByTagName('th');
  for (let i=0; i < headerElements.length; i++) {
    headers.push(headerElements[i].textContent);
  }

  let tableDataObjects = [];
  for(let i=1; i < table.rows.length; i++) {
    let tableRow = table.rows[i];
    if (!checkedOnly || tableRow.classList.contains("checked-row")) {
      let tableDataElements = tableRow.getElementsByTagName('td');
      let tableDataObject = {};
      for (let i=0; i < tableDataElements.length; i++) {
        let tableDataText = unWrapTableData(tableDataElements[i]).textContent;
        if (headers[i] === "Weight") {
          tableDataObject["Weight_In_Gram"] = Number(tableDataText.replace(" g", ""));
        } else if(tableDataText.startsWith("₹ " )) {
          if (tableDataText.endsWith(" /g")) {
            tableDataObject[getKeyFromHeader(headers[i], true)] = getFromDesiRupeeNumber(tableDataText.replace(" /g", ""));
          } else {
            tableDataObject[getKeyFromHeader(headers[i], false)] = getFromDesiRupeeNumber(tableDataText);
          }
        } else if(tableDataText.endsWith("%")) {
          tableDataObject[getKeyFromHeader(headers[i], false) + "_Percentage"] = Number(tableDataText.replace("%", ""));
        } else {
          tableDataObject[getKeyFromHeader(headers[i], false)] = isNaN(Number(tableDataText)) ? tableDataText : Number(tableDataText);
        }
      }

      tableDataObjects.push(tableDataObject);
    }
  }

  return tableDataObjects;
}

function parseSalesTable(table, checkedOnly) {
  let headers = [];
  let headerElements = table.getElementsByTagName('th');
  for (let i=0; i < headerElements.length; i++) {
    headers.push(headerElements[i].textContent);
  }

  let tableDataObjects = [];
  for(let i=1; i < table.rows.length; i++) {
    let tableRow = table.rows[i];
    if (!checkedOnly || tableRow.classList.contains("checked-row")) {
      let tableDataElements = tableRow.getElementsByTagName('td');
      let tableDataObject = {};
      for (let i=0; i < tableDataElements.length; i++) {
        let tableDataText = unWrapTableData(tableDataElements[i]).textContent;
        if (headers[i] === "Weight") {
          tableDataObject["Weight_In_Gram"] = Number(tableDataText.replace(" g", ""));
        } else if (headers[i] === "Price") {
          tableDataObject["Price"] = getFromDesiRupeeNumber(tableDataElements[i].querySelector(".sales-table-price").textContent);
          tableDataObject["Price_Less_GST"] = Number(tableDataElements[i].querySelector(".sales-table-amount").textContent);
        } else if(tableDataText.startsWith("₹ " )) {
          if (tableDataText.endsWith(" /g")) {
            tableDataObject[getKeyFromHeader(headers[i], true)] = getFromDesiRupeeNumber(tableDataText.replace(" /g", ""));
          } else {
            tableDataObject[getKeyFromHeader(headers[i], false)] = getFromDesiRupeeNumber(tableDataText);
          }
        } else if(tableDataText.endsWith("%")) {
          tableDataObject[getKeyFromHeader(headers[i], false) + "_Percentage"] = Number(tableDataText.replace("%", ""));
        } else {
          tableDataObject[getKeyFromHeader(headers[i], false)] = isNaN(Number(tableDataText)) ? tableDataText : Number(tableDataText);
        }
      }

      tableDataObjects.push(tableDataObject);
    }
  }

  return tableDataObjects;
}

function getInputTextFloatValue(element) {
  return Number(element.querySelector(".input-text").value);
}

function getDesiNumber(number) {
  number = Math.round(number);
  let lastDigit = Math.abs(number%10);
  let numberWithoutLastDigit = Math.floor(number/10);
  if (numberWithoutLastDigit > 0) {
    return numberWithoutLastDigit.toString().replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastDigit;
  } else {
    return "" + lastDigit;
  }
}

function getRupeeDesiNumber(number) {
  return (number < 0 ? "- " : "") + "₹ " + getDesiNumber(Math.abs(number));
}

function getDesiDecimalNumber(number) {
  decimalPart = Math.round((number - Math.floor(number)) * 100) / 100;
  return getDesiNumber(Math.floor(number)) + decimalPart.toFixed(2).replace("0.", ".");
}

function getRupeeDesiDecimalNumber(number) {
  return (number < 0 ? "- " : "") + "₹ " + getDesiDecimalNumber(Math.abs(number));
}

function getFromDesiNumber(desiNumber) {
  return Number(desiNumber.replace(/,/g,""));
}

function getFromDesiRupeeNumber(desiRupeeNumber) {
  if(desiRupeeNumber.startsWith("- ₹")) {
    return -1 * getFromDesiNumber(desiRupeeNumber.substring(4))
  }
  return getFromDesiNumber(desiRupeeNumber.substring(2));
}

function generateTransactionId(date) {
  return "S" + process.env.MUNSHI_SYSTEM_NUMBER + "T"
    + getTwoDigitInteger(date.getHours())
    + getTwoDigitInteger(date.getMinutes())
    + getTwoDigitInteger(date.getSeconds());
}

function formatDate(date) {
  return "" + date.getFullYear() + "-" +
    getTwoDigitInteger(date.getMonth() + 1) + "-" +
    getTwoDigitInteger(date.getDate());
}

function formatDateSlash(date) {
  return getTwoDigitInteger(date.getDate()) + "/"
    + getTwoDigitInteger(date.getMonth() + 1) + "/"
    + date.getFullYear();
}

function formatDateReverse(date) {
  return "" + date.getFullYear()
    + getTwoDigitInteger(date.getMonth() + 1)
    + getTwoDigitInteger(date.getDate());
}

function getFinancialYear(date) {
  let prefixYear = date.getFullYear();
  if (date.getMonth() < 3) {
    prefixYear -= 1;
  }

  let suffixYear = prefixYear + 1 - 2000;
  return prefixYear + "-" + suffixYear;
}

function isValidFinancialYear(fyString) {
  let years = fyString.split("-");
  return years.length == 2 && parseInt(years[0].substring(2)) == parseInt(years[1]) - 1;
}

function getTwoDigitInteger(integer) {
  return ("0" + integer).slice(-2);
}

function consolidateEntries(entriesList) {
  let consolidatedEntries = [];
  for (let i=0; i<entriesList.length; i++) {
    let entries = entriesList[i];
    for (let j=0; j<entries.length; j++) {
      consolidatedEntries.push(entries[j]);
    }
  }

  return consolidatedEntries;
}

function padStringWithZeros(numStr, size) {
  while (numStr.length < size) numStr = "0" + numStr;
  return numStr;
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function isMobileNumber(text) {
  return text.match(/^[5-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]$/) != null;
}

function borderColorOnNumberCheck() {
  if (isNaN(Number(this.value)) || this.value === "") {
    this.style.borderColor = "red";
  } else {
    this.style.borderColor = "green";
  }
}

function borderColorOnEmptyCheck() {
  if (this.value === "") {
    this.style.borderColor = "red";
  } else {
    this.style.borderColor = "green";
  }
}

function borderColorOnMobileNumberCheck() {
  if (isMobileNumber(this.value)) {
    this.style.borderColor = "green";
  } else {
    this.style.borderColor = "red";
  }
}

function borderColorOnAlphabetsOnlyCheck() {
  if (this.value.match(/^[a-zA-Z\s,]+$/)) {
    this.style.borderColor = "green";
  } else {
    this.style.borderColor = "red";
  }
}

function getMonths() {
  return [
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
    'January',
    'February',
    'March'
  ];
}

module.exports = {
  clearSelection,
  createHtmlElement,
  removeElement,
  addTableHeader,
  addTableHeaderWithCheckbox,
  addTableData,
  addEquiColumnTableData,
  addTableDataWithCheckbox,
  emptyTable,
  emptyTableWithHeader,
  parseTable,
  parseSalesTable,
  getInputTextFloatValue,
  getDesiNumber,
  getRupeeDesiNumber,
  getDesiDecimalNumber,
  getRupeeDesiDecimalNumber,
  getFromDesiNumber,
  getFromDesiRupeeNumber,
  generateTransactionId,
  formatDate,
  formatDateSlash,
  formatDateReverse,
  getFinancialYear,
  isValidFinancialYear,
  consolidateEntries,
  padStringWithZeros,
  toTitleCase,
  isMobileNumber,
  borderColorOnNumberCheck,
  borderColorOnEmptyCheck,
  borderColorOnMobileNumberCheck,
  borderColorOnAlphabetsOnlyCheck,
  getMonths
}
