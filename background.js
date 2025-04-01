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

    // Set up tab listeners for blocking
    setupTabListeners();

    sendResponse({ success: true });
    return true; // Keep the message channel open for async response
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

// Set up the tab listeners for blocking
function setupTabListeners() {
  // First, remove existing listeners to avoid duplicates
  try {
    chrome.tabs.onUpdated.removeListener(handleTabUpdate);
  } catch (error) {
    console.error("No existing tab listener to remove");
  }

  // Add listener if blocking is enabled and we have sites to block
  if (isBlocking && blockedSites.length > 0) {
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    console.info("Tab listener set up for blocking");
  } else {
    console.error("Blocking disabled or no sites to block");
  }
}

// Handle tab updates to check for blocked sites
function handleTabUpdate(tabId, changeInfo, tab) {
  // Only check if the URL has been updated and if the tab is done loading
  if (changeInfo.url && isBlocking) {
    console.info("Tab updated, checking URL:", changeInfo.url);

    if (shouldBlockUrl(changeInfo.url)) {
      console.info("Blocking and redirecting tab:", tabId);

      // Redirect to blocked page
      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL("blocked.html"),
      });
    }
  }
}

// Check if a URL should be blocked
function shouldBlockUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, "");

    console.info("Checking if should block:", hostname);
    console.info("Blocked sites:", blockedSites);

    // Don't block extension pages
    if (url.startsWith(chrome.runtime.getURL(""))) {
      console.log("Not blocking extension page");
      return false;
    }

    for (const site of blockedSites) {
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

    console.info("Not blocking:", hostname);
    return false;
  } catch (error) {
    console.error("Error checking URL:", error, "URL:", url);
    return false;
  }
}

// Listen for browser startup
chrome.runtime.onStartup.addListener(function () {
  console.info("Browser started");
  loadSettings();
});

// Also monitor navigation to catch sites that tab updates might miss
chrome.webNavigation.onCommitted.addListener(function (details) {
  // Only check main frame (not iframes, etc.)
  if (details.frameId === 0 && isBlocking) {
    console.info("Navigation committed, checking URL:", details.url);

    if (shouldBlockUrl(details.url)) {
      console.info("Blocking and redirecting navigation:", details.tabId);

      // Redirect to blocked page
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL("blocked.html"),
      });
    }
  }
});
