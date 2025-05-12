document.addEventListener("DOMContentLoaded", function () {
  console.log("Popup script loaded");

  const blockToggle = document.getElementById("blockToggle");
  const statusText = document.getElementById("statusText");
  const siteInput = document.getElementById("siteInput");
  const addBtn = document.getElementById("addBtn");
  const sitesList = document.getElementById("sitesList");
  const saveStatus = document.getElementById("saveStatus");
  const privacyLink = document.getElementById("privacyLink");

  console.log("DOM elements:", {
    blockToggle: !!blockToggle,
    statusText: !!statusText,
    siteInput: !!siteInput,
    addBtn: !!addBtn,
    sitesList: !!sitesList,
    saveStatus: !!saveStatus,
  });

  let blockedSites = [];
  let isBlocking = false;

  loadSettings();

  blockToggle.addEventListener("click", function () {
    console.log("Block toggle clicked");
    isBlocking = this.checked;
    statusText.textContent = "Blocking Mode: " + (isBlocking ? "On" : "Off");
    statusText.style.color = isBlocking ? "#83ECCD" : "#ffffff";

    saveSettings();
  });

  addBtn.addEventListener("click", function () {
    console.log("Add button clicked");
    addSite();
  });

  siteInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      console.log("Enter key pressed in input");
      addSite();
    }
  });

  privacyLink.addEventListener("click", function (e) {
    e.preventDefault();
    chrome.tabs.create({
      url: this.href,
    });
  });

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

      saveSettings();
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

      const siteText = document.createTextNode(site);
      li.appendChild(siteText);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "X";
      deleteBtn.className = "delete-btn";
      deleteBtn.addEventListener("click", function () {
        console.log("Delete button clicked for:", site);
        blockedSites.splice(index, 1);
        renderSitesList();

        saveSettings();
      });

      li.appendChild(deleteBtn);
      sitesList.appendChild(li);
    });
  }

  function showSaveStatus(message = "Saved", duration = 2000) {
    saveStatus.textContent = message;
    saveStatus.style.opacity = "1";

    setTimeout(() => {
      saveStatus.style.opacity = "0";
    }, duration);
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
        statusText.style.color = isBlocking ? "#83ECCD" : "#ffffff";
      }
    });
  }

  function saveSettings() {
    console.log("Saving settings");

    showSaveStatus("Saving...");

    chrome.storage.sync.set(
      {
        blockedSites: blockedSites,
        isBlocking: isBlocking,
      },
      function () {
        console.log("Settings saved to storage");

        chrome.runtime.sendMessage(
          {
            action: "updateBlocking",
            blockedSites: blockedSites,
            isBlocking: isBlocking,
          },
          function (response) {
            console.log("Background response:", response);
            showSaveStatus("Saved");
          },
        );
      },
    );
  }

  console.log("Popup script initialization complete");
});
