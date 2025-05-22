if (typeof browser === "undefined") {
  var browser = chrome;
}

let isBlocking = false;
let blockedSites = [];

chrome.runtime.onInstalled.addListener(function () {
  console.log("Distraction Block installed");
  loadSettings();
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("Background received message:", message);

  if (message.action === "updateBlocking") {
    blockedSites = message.blockedSites || [];
    isBlocking = message.isBlocking;

    console.log("Updated blocking settings:", { isBlocking, blockedSites });
    setupTabListeners();

    chrome.storage.sync.set(
      {
        blockedSites: blockedSites,
        isBlocking: isBlocking,
      },
      function () {
        console.log("Settings persisted by background script");
      },
    );

    sendResponse({ success: true });
    return true;
  } else if (message.action === "getBlockingStatus") {
    sendResponse({
      isBlocking: isBlocking,
      blockedSites: blockedSites,
    });
    return true;
  }
});

function loadSettings() {
  chrome.storage.sync.get(["blockedSites", "isBlocking"], function (result) {
    blockedSites = result.blockedSites || [];
    isBlocking = result.isBlocking || false;

    console.log("Loaded settings:", { isBlocking, blockedSites });

    setupTabListeners();
  });
}

function setupTabListeners() {
  try {
    chrome.tabs.onUpdated.removeListener(handleTabUpdate);
  } catch (error) {
    console.error("No existing tab listener to remove");
  }

  if (isBlocking && blockedSites.length > 0) {
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    console.info("Tab listener set up for blocking");
  } else {
    console.info("Blocking disabled or no sites to block");
  }
}

function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.url && isBlocking) {
    console.info("Tab updated, checking URL:", changeInfo.url);

    if (shouldBlockUrl(changeInfo.url)) {
      console.info("Blocking and redirecting tab:", tabId);

      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL("blocked.html"),
      });
    }
  }
}

function shouldBlockUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, "");

    console.info("Checking if should block:", hostname);
    console.info("Blocked sites:", blockedSites);

    if (url.startsWith(chrome.runtime.getURL(""))) {
      console.log("Not blocking extension page");
      return false;
    }

    for (const site of blockedSites) {
      const blockedDomain = site.replace(/^www\./, "");

      if (
        hostname === blockedDomain ||
        hostname.endsWith("." + blockedDomain)
      ) {
        console.info("Should block:", hostname, "(matches", blockedDomain, ")");
        return true;
      }
    }

    console.info("Not blocking:", hostname);
    return false;
  } catch (error) {
    console.error("Error checking URL:", error, "URL:", url);
    return false;
  }
}

chrome.runtime.onStartup.addListener(function () {
  console.info("Browser started");
  loadSettings();
});

chrome.webNavigation.onCommitted.addListener(function (details) {
  if (details.frameId === 0 && isBlocking) {
    console.info("Navigation committed, checking URL:", details.url);

    if (shouldBlockUrl(details.url)) {
      console.info("Blocking and redirecting navigation:", details.tabId);

      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL("blocked.html"),
      });
    }
  }
});

// Reload when the window gets focus
chrome.windows.onFocusChanged.addListener(function (windowId) {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    console.log("Window gained focus, refreshing settings...");
    loadSettings();
  }
});

// Reload when tab gets activated
chrome.tabs.onActivated.addListener(function (activeInfo) {
  if (activeInfo.tabId !== chrome.tabs.TAB_ID_NONE) {
    console.log("Tab activated, refreshing settings...");
    loadSettings();
  }
});
