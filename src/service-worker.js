console.log("Distraction Block service worker initializing");

let isBlocking = false;
let blockedSites = [];
let settingsLoaded = false;

const settingsLoadedPromise = new Promise((resolve) => {
  loadSettings(() => {
    settingsLoaded = true;
    resolve();
  });
});

// Always attach listeners at startup; they'll check internal state before taking action
setupPermanentListeners();

chrome.runtime.onInstalled.addListener(function () {
  console.log("Distraction Block installed");
  loadSettings();
});

chrome.runtime.onStartup.addListener(function () {
  console.info("Browser started");
  loadSettings();
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("Background received message:", message);

  if (message.action === "updateBlocking") {
    blockedSites = message.blockedSites || [];
    isBlocking = message.isBlocking;
    settingsLoaded = true;

    console.log("Updated blocking settings:", { isBlocking, blockedSites });

    chrome.storage.sync.set(
      {
        blockedSites: blockedSites,
        isBlocking: isBlocking,
      },
      function () {
        console.log("Settings persisted by background script");
        sendResponse({ success: true });
      },
    );
    return true;
  } else if (message.action === "getBlockingStatus") {
    if (settingsLoaded) {
      sendResponse({
        isBlocking: isBlocking,
        blockedSites: blockedSites,
      });
    } else {
      chrome.storage.sync.get(
        ["blockedSites", "isBlocking"],
        function (result) {
          sendResponse({
            isBlocking: result.isBlocking || false,
            blockedSites: result.blockedSites || [],
          });
        },
      );
    }
    return true;
  }
});

// Load settings from storage
function loadSettings(callback) {
  chrome.storage.sync.get(["blockedSites", "isBlocking"], function (result) {
    blockedSites = result.blockedSites || [];
    isBlocking = result.isBlocking || false;

    console.log("Loaded settings:", { isBlocking, blockedSites });

    if (callback) callback();
  });
}

function setupPermanentListeners() {
  console.log("Setting up permanent tab and navigation listeners");
  chrome.tabs.onUpdated.addListener(handleTabUpdate);
  chrome.webNavigation.onCommitted.addListener(handleNavigation);
}

async function getBlockingState() {
  if (!settingsLoaded) {
    console.log("Waiting for settings to load before checking blocking state");
    await settingsLoadedPromise;
  }

  return { isBlocking, blockedSites };
}

async function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    const { isBlocking, blockedSites } = await getBlockingState();

    if (!isBlocking || blockedSites.length === 0) {
      return;
    }

    console.info("Tab updated, checking URL:", changeInfo.url);

    if (shouldBlockUrl(changeInfo.url, blockedSites)) {
      console.info("Blocking and redirecting tab:", tabId);

      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL("blocked.html"),
      });
    }
  }
}

async function handleNavigation(details) {
  if (details.frameId === 0) {
    const { isBlocking, blockedSites } = await getBlockingState();

    if (!isBlocking || blockedSites.length === 0) {
      return;
    }

    console.info("Navigation committed, checking URL:", details.url);

    if (shouldBlockUrl(details.url, blockedSites)) {
      console.info("Blocking and redirecting navigation:", details.tabId);

      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL("blocked.html"),
      });
    }
  }
}

function shouldBlockUrl(url, sitesList) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, "");

    if (url.startsWith(chrome.runtime.getURL(""))) {
      return false;
    }

    for (const site of sitesList) {
      const blockedDomain = site.replace(/^www\./, "");

      if (
        hostname === blockedDomain ||
        hostname.endsWith("." + blockedDomain)
      ) {
        console.info("Should block:", hostname, "(matches", blockedDomain, ")");
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking URL:", error, "URL:", url);
    return false;
  }
}

console.log("Distraction Block service worker initialized successfully");
