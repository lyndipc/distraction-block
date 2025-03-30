// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", function () {
  console.log("Popup script loaded");

  // Get DOM elements
  const blockToggle = document.getElementById("blockToggle");
  const statusText = document.getElementById("statusText");
  const siteInput = document.getElementById("siteInput");
  const addBtn = document.getElementById("addBtn");
  const sitesList = document.getElementById("sitesList");
  const saveBtn = document.getElementById("saveBtn");

  console.log("DOM elements:", {
    blockToggle: !!blockToggle,
    statusText: !!statusText,
    siteInput: !!siteInput,
    addBtn: !!addBtn,
    sitesList: !!sitesList,
    saveBtn: !!saveBtn,
  });

  // State variables
  let blockedSites = [];
  let isBlocking = false;
  let hasUnsavedChanges = false;

  // Load saved settings
  loadSettings();

  // Event listeners
  blockToggle.addEventListener("click", function () {
    console.log("Block toggle clicked");
    isBlocking = this.checked;
    statusText.textContent = "Blocking Mode: " + (isBlocking ? "On" : "Off");
    markAsUnsaved();
  });

  // Add button click handler
  addBtn.addEventListener("click", function () {
    console.log("Add button clicked");
    addSite();
  });

  // Input enter key handler
  siteInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      console.log("Enter key pressed in input");
      addSite();
    }
  });

  // Save button click handler
  saveBtn.addEventListener("click", function () {
    console.log("Save button clicked");
    saveSettings();
  });

  // Functions
  function addSite() {
    const site = siteInput.value.trim();
    console.log("Adding site:", site);

    if (!site) {
      console.log("Empty input, not adding");
      return;
    }

    // Format URL (remove http://, https://, www.)
    let formattedSite = site
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]; // Remove everything after first slash

    console.log("Formatted site:", formattedSite);

    if (!formattedSite.includes(".")) {
      console.log("Invalid domain, must include a dot");
      alert("Please enter a valid domain (e.g., facebook.com)");
      return;
    }

    if (!blockedSites.includes(formattedSite)) {
      console.log("Adding to blocked sites list");
      blockedSites.push(formattedSite);
      siteInput.value = "";
      renderSitesList();
      markAsUnsaved();
    } else {
      console.log("Site already in list");
      siteInput.value = "";
    }
  }

  function renderSitesList() {
    console.log("Rendering sites list");
    sitesList.innerHTML = "";

    blockedSites.forEach(function (site, index) {
      const li = document.createElement("li");

      // Site name
      const siteText = document.createTextNode(site);
      li.appendChild(siteText);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "×";
      deleteBtn.className = "delete-btn";
      deleteBtn.addEventListener("click", function () {
        console.log("Delete button clicked for:", site);
        blockedSites.splice(index, 1);
        renderSitesList();
        markAsUnsaved();
      });

      li.appendChild(deleteBtn);
      sitesList.appendChild(li);
    });
  }

  function markAsUnsaved() {
    console.log("Marking as unsaved");
    hasUnsavedChanges = true;
    saveBtn.classList.add("unsaved");
    saveBtn.textContent = "Save Settings";
  }

  function loadSettings() {
    console.log("Loading settings");
    chrome.storage.sync.get(["blockedSites", "isBlocking"], function (result) {
      console.log("Settings loaded:", result);

      if (result.blockedSites) {
        blockedSites = result.blockedSites;
        renderSitesList();
      }

      if (result.isBlocking !== undefined) {
        isBlocking = result.isBlocking;
        blockToggle.checked = isBlocking;
        statusText.textContent =
          "Blocking Mode: " + (isBlocking ? "On" : "Off");
      }

      hasUnsavedChanges = false;
      saveBtn.classList.remove("unsaved");
      saveBtn.textContent = "Saved";
    });
  }

  function saveSettings() {
    console.log("Saving settings");

    if (!hasUnsavedChanges) {
      console.log("No changes to save");
      return;
    }

    saveBtn.textContent = "Saving...";

    chrome.storage.sync.set(
      {
        blockedSites: blockedSites,
        isBlocking: isBlocking,
      },
      function () {
        console.log("Settings saved to storage");

        // Notify background script
        chrome.runtime.sendMessage(
          {
            action: "updateBlocking",
            blockedSites: blockedSites,
            isBlocking: isBlocking,
          },
          function (response) {
            console.log("Background response:", response);
            hasUnsavedChanges = false;
            saveBtn.classList.remove("unsaved");
            saveBtn.textContent = "Saved";
          },
        );
      },
    );
  }

  console.log("Popup script initialization complete");
});
