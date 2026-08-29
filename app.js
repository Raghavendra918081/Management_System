const API_URL =
  "https://script.google.com/macros/s/AKfycbz_fA5vSuCId7quJ0CTaMEf_B6qHnTLObJhzWaG6B6ZadbmdHepYUUsp4Sjd6nnwII/exec";


let stores = [];
let activeVBAs = [];
let currentVBAs = [];

let modalResolver = null;


// =====================================================
// START
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  init
);


async function init() {

  setupNavigation();

  setupForms();

  setupModal();

  setToday();

  await refreshData();

}


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

  document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        function() {

          const page =
            this.dataset.page;

          showPage(page);

        }
      );

    });

}


function showPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(element =>
      element.classList.remove("active")
    );


  document
    .querySelectorAll(".nav-btn")
    .forEach(element =>
      element.classList.remove("active")
    );


  document
    .getElementById(
      "page-" + page
    )
    .classList
    .add("active");


  document
    .querySelector(
      `[data-page="${page}"]`
    )
    .classList
    .add("active");


  if (page === "current") {
    loadCurrentVBAs();
  }

}


// =====================================================
// API
// =====================================================

async function api(action, payload = {}) {

  const response =
    await fetch(API_URL, {

      method: "POST",

      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },

      body: JSON.stringify({
        action,
        ...payload
      })

    });


  if (!response.ok) {

    throw new Error(
      "Server request failed."
    );

  }


  const result =
    await response.json();


  if (!result.success) {

    throw new Error(
      result.message ||
      "Operation failed."
    );

  }


  return result.data;

}


// =====================================================
// LOAD DATA
// =====================================================

async function refreshData() {

  try {

    const [
      storeResult,
      vbaResult
    ] =
      await Promise.all([

        api("getActiveStores"),

        api("getActiveVBAs")

      ]);


    stores =
      storeResult || [];


    activeVBAs =
      vbaResult || [];


    fillStoreDropdowns();

    fillVBADropdowns();


  } catch (error) {

    toast(
      "error",
      "Data load failed",
      error.message
    );

  }

}


// =====================================================
// DROPDOWNS
// =====================================================

function fillStoreDropdowns() {

  fillSelect(
    "add-store",
    stores,
    "storeId",
    item =>
      item.storeId +
      " - " +
      item.storeName,
    "Select Store"
  );


  fillSelect(
    "transfer-store",
    stores,
    "storeId",
    item =>
      item.storeId +
      " - " +
      item.storeName,
    "Select New Store"
  );

}


function fillVBADropdowns() {

  fillSelect(
    "transfer-vba",
    activeVBAs,
    "vbaId",
    item =>
      item.vbaId +
      " - " +
      item.fullName,
    "Select VBA"
  );


  fillSelect(
    "resign-vba",
    activeVBAs,
    "vbaId",
    item =>
      item.vbaId +
      " - " +
      item.fullName,
    "Select VBA"
  );

}


function fillSelect(
  elementId,
  data,
  valueField,
  labelFunction,
  firstLabel
) {

  const select =
    document.getElementById(
      elementId
    );


  select.innerHTML = "";


  const first =
    document.createElement(
      "option"
    );


  first.value = "";

  first.textContent =
    firstLabel;


  select.appendChild(first);


  data.forEach(item => {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      item[valueField];


    option.textContent =
      labelFunction(item);


    select.appendChild(option);

  });

}


// =====================================================
// FORMS
// =====================================================

function setupForms() {

  document
    .getElementById(
      "add-store"
    )
    .addEventListener(
      "change",
      showAddStore
    );


  document
    .getElementById(
      "transfer-vba"
    )
    .addEventListener(
      "change",
      showCurrentTransfer
    );


  document
    .getElementById(
      "transfer-store"
    )
    .addEventListener(
      "change",
      showNewTransfer
    );


  document
    .getElementById(
      "resign-vba"
    )
    .addEventListener(
      "change",
      showResignEmployee
    );


  document
    .getElementById(
      "add-form"
    )
    .addEventListener(
      "submit",
      submitAdd
    );


  document
    .getElementById(
      "transfer-form"
    )
    .addEventListener(
      "submit",
      submitTransfer
    );


  document
    .getElementById(
      "resign-form"
    )
    .addEventListener(
      "submit",
      submitResign
    );


  document
    .getElementById(
      "search"
    )
    .addEventListener(
      "input",
      searchCurrent
    );

}


// =====================================================
// ADD PREVIEW
// =====================================================

function showAddStore() {

  const store =
    getStore(this.value);


  const box =
    document.getElementById(
      "add-store-preview"
    );


  if (!store) {

    box.classList.add("hidden");

    return;

  }


  document
    .getElementById(
      "add-partner"
    )
    .textContent =
    store.partner;


  document
    .getElementById(
      "add-zone"
    )
    .textContent =
    store.zone;


  document
    .getElementById(
      "add-city"
    )
    .textContent =
    store.city;


  box.classList.remove("hidden");

}


// =====================================================
// TRANSFER PREVIEW
// =====================================================

function showCurrentTransfer() {

  const vba =
    getVBA(this.value);


  const box =
    document.getElementById(
      "transfer-current"
    );


  if (!vba) {

    box.classList.add("hidden");

    return;

  }


  document
    .getElementById(
      "old-store"
    )
    .textContent =
    vba.storeName;


  document
    .getElementById(
      "old-partner"
    )
    .textContent =
    vba.partner;


  document
    .getElementById(
      "old-zone"
    )
    .textContent =
    vba.zone;


  document
    .getElementById(
      "old-city"
    )
    .textContent =
    vba.city;


  box.classList.remove("hidden");

}


function showNewTransfer() {

  const vba =
    getVBA(
      document
        .getElementById(
          "transfer-vba"
        )
        .value
    );


  const store =
    getStore(this.value);


  if (!vba) {

    toast(
      "error",
      "Select VBA first",
      "Choose an employee before selecting new store."
    );

    this.value = "";

    return;

  }


  if (!store) {
    return;
  }


  if (
    vba.storeId ===
    store.storeId
  ) {

    toast(
      "error",
      "Invalid transfer",
      "Current Store and New Store cannot be the same."
    );

    this.value = "";

    return;

  }


  document
    .getElementById(
      "new-store"
    )
    .textContent =
    store.storeName;


  document
    .getElementById(
      "new-partner"
    )
    .textContent =
    store.partner;


  document
    .getElementById(
      "new-zone"
    )
    .textContent =
    store.zone;


  document
    .getElementById(
      "new-city"
    )
    .textContent =
    store.city;


  document
    .getElementById(
      "transfer-new"
    )
    .classList
    .remove("hidden");

}


// =====================================================
// RESIGN PREVIEW
// =====================================================

function showResignEmployee() {

  const vba =
    getVBA(this.value);


  const box =
    document.getElementById(
      "resign-preview"
    );


  if (!vba) {

    box.classList.add("hidden");

    return;

  }


  document
    .getElementById(
      "resign-store"
    )
    .textContent =
    vba.storeName;


  document
    .getElementById(
      "resign-partner"
    )
    .textContent =
    vba.partner;


  document
    .getElementById(
      "resign-zone"
    )
    .textContent =
    vba.zone;


  box.classList.remove("hidden");

}


// =====================================================
// ADD VBA
// =====================================================

async function submitAdd(event) {

  event.preventDefault();


  const data = {

    fullName:
      value("add-name"),

    mobile:
      value("add-mobile"),

    dob:
      value("add-dob"),

    employeeCode:
      value("add-code"),

    joiningDate:
      value("add-joining-date"),

    storeId:
      value("add-store")

  };


  const store =
    getStore(
      data.storeId
    );


  const confirmed =
    await confirmModal({

      title:
        "Create New VBA",

      description:
        "Please verify employee information before creating the account.",

      content:

        `<strong>${safe(data.fullName)}</strong>
        <br>${safe(data.mobile)}
        <br><br>
        Joining: <strong>${safe(data.joiningDate)}</strong>
        <br><br>
        Store:
        <strong>${safe(store.storeName)}</strong>
        <br>
        ${safe(store.partner)} · ${safe(store.zone)}`,

      danger:
        false,

      confirmText:
        "Create VBA"

    });


  if (!confirmed) return;


  try {

    const result =
      await api(
        "addNewVBA",
        { formData: data }
      );


    toast(
      "success",
      "VBA created",
      result.name +
      " created as " +
      result.vbaId
    );


    event.target.reset();


    document
      .getElementById(
        "add-store-preview"
      )
      .classList
      .add("hidden");


    setToday();

    await refreshData();


  } catch (error) {

    toast(
      "error",
      "Unable to create VBA",
      error.message
    );

  }

}


// =====================================================
// TRANSFER
// =====================================================

async function submitTransfer(event) {

  event.preventDefault();


  const data = {

    vbaId:
      value("transfer-vba"),

    newStoreId:
      value("transfer-store"),

    effectiveDate:
      value("transfer-date"),

    reason:
      value("transfer-reason")

  };


  const vba =
    getVBA(data.vbaId);


  const store =
    getStore(
      data.newStoreId
    );


  const confirmed =
    await confirmModal({

      title:
        "Confirm VBA Transfer",

      description:
        "Please verify the movement before posting.",

      content:

        `<strong>${safe(vba.fullName)}</strong>
        <br>${safe(vba.vbaId)}

        <br><br>

        <small>Current Assignment</small>
        <br>
        <strong>${safe(vba.storeName)}</strong>
        <br>
        ${safe(vba.partner)} · ${safe(vba.zone)}

        <br><br>

        <div style="text-align:center;font-size:22px">↓</div>

        <small>New Assignment</small>
        <br>
        <strong>${safe(store.storeName)}</strong>
        <br>
        ${safe(store.partner)} · ${safe(store.zone)}

        <br><br>

        Effective Date:
        <strong>${safe(data.effectiveDate)}</strong>`,

      danger:
        false,

      confirmText:
        "Confirm Transfer"

    });


  if (!confirmed) return;


  try {

    const result =
      await api(
        "transferVBA",
        { formData: data }
      );


    toast(
      "success",
      "Transfer completed",
      result.name +
      " transferred to " +
      result.newStoreName
    );


    event.target.reset();


    document
      .getElementById(
        "transfer-current"
      )
      .classList
      .add("hidden");


    document
      .getElementById(
        "transfer-new"
      )
      .classList
      .add("hidden");


    setToday();

    await refreshData();


  } catch (error) {

    toast(
      "error",
      "Transfer failed",
      error.message
    );

  }

}


// =====================================================
// RESIGN
// =====================================================

async function submitResign(event) {

  event.preventDefault();


  const data = {

    vbaId:
      value("resign-vba"),

    lastWorkingDate:
      value("resign-date"),

    reason:
      value("resign-reason")

  };


  const vba =
    getVBA(data.vbaId);


  const confirmed =
    await confirmModal({

      title:
        "Confirm VBA Resignation",

      description:
        "The employee will be removed from active manpower. Historical records will remain.",

      content:

        `<strong>${safe(vba.fullName)}</strong>
        <br>${safe(vba.vbaId)}

        <br><br>

        Current Assignment
        <br>
        <strong>${safe(vba.storeName)}</strong>
        <br>
        ${safe(vba.partner)} · ${safe(vba.zone)}

        <br><br>

        Last Working Date:
        <strong>${safe(data.lastWorkingDate)}</strong>

        <br><br>

        Reason:
        ${safe(data.reason)}`,

      danger:
        true,

      confirmText:
        "Confirm Resignation"

    });


  if (!confirmed) return;


  try {

    const result =
      await api(
        "resignVBA",
        { formData: data }
      );


    toast(
      "success",
      "Resignation recorded",
      result.name +
      " removed from active VBA."
    );


    event.target.reset();


    document
      .getElementById(
        "resign-preview"
      )
      .classList
      .add("hidden");


    setToday();

    await refreshData();


  } catch (error) {

    toast(
      "error",
      "Resignation failed",
      error.message
    );

  }

}


// =====================================================
// CURRENT VBA
// =====================================================

async function loadCurrentVBAs() {

  try {

    currentVBAs =
      await api(
        "getCurrentVBAList"
      ) || [];


    renderTable(
      currentVBAs
    );


  } catch (error) {

    toast(
      "error",
      "Unable to load manpower",
      error.message
    );

  }

}


function searchCurrent() {

  const term =
    value("search")
      .toLowerCase();


  const filtered =
    currentVBAs.filter(item => {

      return JSON
        .stringify(item)
        .toLowerCase()
        .includes(term);

    });


  renderTable(filtered);

}


function renderTable(data) {

  const tbody =
    document.getElementById(
      "vba-table"
    );


  tbody.innerHTML = "";


  data.forEach(vba => {

    const tr =
      document.createElement(
        "tr"
      );


    tr.innerHTML = `

      <td>${safe(vba.vbaId)}</td>

      <td>
        <strong>
          ${safe(vba.name)}
        </strong>
      </td>

      <td>${safe(vba.mobile)}</td>

      <td>
        ${safe(vba.employeeCode)}
      </td>

      <td>${safe(vba.partner)}</td>

      <td>${safe(vba.storeName)}</td>

      <td>${safe(vba.zone)}</td>

      <td>${safe(vba.city)}</td>

      <td>
        ${safe(vba.joiningDate)}
      </td>

    `;


    tbody.appendChild(tr);

  });


  document
    .getElementById(
      "employee-count"
    )
    .textContent =
    data.length +
    " Active VBA";

}


// =====================================================
// MODAL
// =====================================================

function setupModal() {

  document
    .getElementById(
      "modal-cancel"
    )
    .addEventListener(
      "click",
      () => closeModal(false)
    );


  document
    .getElementById(
      "modal-confirm"
    )
    .addEventListener(
      "click",
      () => closeModal(true)
    );

}


function confirmModal(options) {

  return new Promise(resolve => {

    modalResolver = resolve;


    document
      .getElementById(
        "modal-title"
      )
      .textContent =
      options.title;


    document
      .getElementById(
        "modal-description"
      )
      .textContent =
      options.description;


    document
      .getElementById(
        "modal-content"
      )
      .innerHTML =
      options.content;


    const confirmButton =
      document.getElementById(
        "modal-confirm"
      );


    confirmButton.textContent =
      options.confirmText;


    if (options.danger) {

      confirmButton.className =
        "danger-btn";

      document
        .getElementById(
          "modal-icon"
        )
        .textContent =
        "!";

    }

    else {

      confirmButton.className =
        "primary-btn";

      document
        .getElementById(
          "modal-icon"
        )
        .textContent =
        "✓";

    }


    document
      .getElementById(
        "modal"
      )
      .classList
      .remove("hidden");

  });

}


function closeModal(result) {

  document
    .getElementById(
      "modal"
    )
    .classList
    .add("hidden");


  if (modalResolver) {

    modalResolver(result);

    modalResolver = null;

  }

}


// =====================================================
// TOAST
// =====================================================

function toast(
  type,
  title,
  message
) {

  const container =
    document.getElementById(
      "toast-container"
    );


  const element =
    document.createElement(
      "div"
    );


  element.className =
    "toast " + type;


  element.innerHTML = `

    <strong>${safe(title)}</strong>

    <span>${safe(message)}</span>

  `;


  container.appendChild(
    element
  );


  setTimeout(
    () => element.remove(),
    4000
  );

}


// =====================================================
// HELPERS
// =====================================================

function getStore(id) {

  return stores.find(
    store =>
      store.storeId === id
  );

}


function getVBA(id) {

  return activeVBAs.find(
    vba =>
      vba.vbaId === id
  );

}


function value(id) {

  return document
    .getElementById(id)
    .value
    .trim();

}


function safe(value) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    value || "";


  return div.innerHTML;

}


function setToday() {

  const now =
    new Date();


  const date =
    now.getFullYear() +
    "-" +
    String(
      now.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      now.getDate()
    ).padStart(2, "0");


  [
    "add-joining-date",
    "transfer-date",
    "resign-date"
  ]
  .forEach(id => {

    document
      .getElementById(id)
      .value =
      date;

  });

}