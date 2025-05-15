// Service worker for Chrome Manifest V3
console.log("Distraction Block service worker initializing");

// Set up global state
let isBlocking = false;
let blockedSites = [];
let settingsLoaded = false;

// Create a promise to track when settings are fully loaded
const settingsLoadedPromise = new Promise((resolve) => {
  // Load settings immediately when service worker starts
  loadSettings(() => {
    settingsLoaded = true;
    resolve();
  });
});

// Always attach listeners at startup, but they'll check internal state before taking action
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

    // Persist settings to storage
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
    return true; // Keep the message channel open for async response
  } else if (message.action === "getBlockingStatus") {
    // Immediately try to get from memory
    if (settingsLoaded) {
      sendResponse({
        isBlocking: isBlocking,
        blockedSites: blockedSites,
      });
    } else {
      // If settings not loaded yet, get from storage
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

// Load settings from storage with an optional callback
function loadSettings(callback) {
  chrome.storage.sync.get(["blockedSites", "isBlocking"], function (result) {
    blockedSites = result.blockedSites || [];
    isBlocking = result.isBlocking || false;

    console.log("Loaded settings:", { isBlocking, blockedSites });

    if (callback) callback();
  });
}

// Set up permanent listeners that will always be active
function setupPermanentListeners() {
  console.log("Setting up permanent tab and navigation listeners");

  // These listeners will always be present, but they'll check state before taking action
  chrome.tabs.onUpdated.addListener(handleTabUpdate);
  chrome.webNavigation.onCommitted.addListener(handleNavigation);
}

// Get the current blocking state, ensuring settings are loaded first
async function getBlockingState() {
  // If settings aren't loaded yet, wait for them
  if (!settingsLoaded) {
    console.log("Waiting for settings to load before checking blocking state");
    await settingsLoadedPromise;
  }

  return { isBlocking, blockedSites };
}

// Handle tab updates to check for blocked sites
async function handleTabUpdate(tabId, changeInfo, tab) {
  // Only check if the URL has been updated
  if (changeInfo.url) {
    const { isBlocking, blockedSites } = await getBlockingState();

    // Skip processing if blocking is disabled or no sites to block
    if (!isBlocking || blockedSites.length === 0) {
      return;
    }

    console.info("Tab updated, checking URL:", changeInfo.url);

    if (shouldBlockUrl(changeInfo.url, blockedSites)) {
      console.info("Blocking and redirecting tab:", tabId);

      // Redirect to blocked page
      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL("blocked.html"),
      });
    }
  }
}

// Handle navigation events
async function handleNavigation(details) {
  // Only check main frame (not iframes, etc.)
  if (details.frameId === 0) {
    const { isBlocking, blockedSites } = await getBlockingState();

    // Skip processing if blocking is disabled or no sites to block
    if (!isBlocking || blockedSites.length === 0) {
      return;
    }

    console.info("Navigation committed, checking URL:", details.url);

    if (shouldBlockUrl(details.url, blockedSites)) {
      console.info("Blocking and redirecting navigation:", details.tabId);

      // Redirect to blocked page
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL("blocked.html"),
      });
    }
  }
}

// Check if a URL should be blocked
function shouldBlockUrl(url, sitesList) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, "");

    // Don't block extension pages
    if (url.startsWith(chrome.runtime.getURL(""))) {
      return false;
    }

    for (const site of sitesList) {
      const blockedDomain = site.replace(/^www\./, "");

      // Check for exact match or subdomain match
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
