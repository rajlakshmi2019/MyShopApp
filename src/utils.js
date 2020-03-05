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
  number = Math.floor(number);
  let lastDegit = Math.abs(number%10);
  let numberWithoutLastDegit = Math.floor(number/10);
  if (numberWithoutLastDegit > 0) {
    return numberWithoutLastDegit.toString().replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastDegit;
  } else {
    return "" + lastDegit;
  }
}

function getFromDesiNumber(desiNumber) {
  return Number(desiNumber.replace(/,/g,""));
}

function getFromDesiRupeeNumber(desiRupeeNumber) {
  return getFromDesiNumber(desiRupeeNumber.substring(2));
}

function generateTransactionId(date) {
  return "S" + process.env.MUNSHI_SYSTEM_NUMBER + "T"
    + getTwoDigitInteger(date.getHours())
    + getTwoDigitInteger(date.getMinutes())
    + getTwoDigitInteger(date.getSeconds());
}

function formatDate(date) {
  return getTwoDigitInteger(date.getDate()) + "-"
    + getTwoDigitInteger(date.getMonth() + 1) + "-"
    + date.getFullYear();
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

module.exports = {
  clearSelection,
  createHtmlElement,
  removeElement,
  addTableHeader,
  addTableHeaderWithCheckbox,
  addTableData,
  addTableDataWithCheckbox,
  emptyTable,
  parseTable,
  getInputTextFloatValue,
  getDesiNumber,
  getFromDesiNumber,
  getFromDesiRupeeNumber,
  generateTransactionId,
  formatDate,
  formatDateSlash,
  formatDateReverse,
  consolidateEntries
}
