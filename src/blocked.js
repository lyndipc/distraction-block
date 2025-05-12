let isBlocking = false;
let blockedSites = [];

chrome.runtime.onInstalled.addListener(function () {
  console.log("Distraction Block installed");
  loadSettings();
});

// Handle messages from popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "updateBlocking") {
    blockedSites = message.blockedSites || [];
    isBlocking = message.isBlocking;

    console.log("Updated blocking settings:", { isBlocking, blockedSites });

    setupBlocker();
    sendResponse({ success: true });
  }
});

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(["blockedSites", "isBlocking"], function (result) {
    blockedSites = result.blockedSites || [];
    isBlocking = result.isBlocking || false;

    console.log("Loaded settings:", { isBlocking, blockedSites });

    setupBlocker();
  });
}

// Set up the blocking mechanism
function setupBlocker() {
  // Remove existing listener if any
  if (chrome.webRequest.onBeforeRequest.hasListener(checkRequest)) {
    chrome.webRequest.onBeforeRequest.removeListener(checkRequest);
  }

  // Add listener only if blocking is enabled and we have sites to block
  if (isBlocking && blockedSites.length > 0) {
    chrome.webRequest.onBeforeRequest.addListener(
      checkRequest,
      { urls: ["<all_urls>"], types: ["main_frame"] },
      ["blocking"],
    );

    console.log("Blocking enabled for:", blockedSites);
  } else {
    console.log("Blocking disabled");
  }
}

// Check if a request should be blocked
function checkRequest(details) {
  try {
    const url = new URL(details.url);
    const hostname = url.hostname.replace(/^www\./, "");

    for (const site of blockedSites) {
      const blockedDomain = site.replace(/^www\./, "");

      if (
        hostname === blockedDomain ||
        hostname.endsWith("." + blockedDomain)
      ) {
        console.log("Blocking:", hostname);

        // Redirect to blocked page
        return {
          redirectUrl: chrome.runtime.getURL("blocked.html"),
        };
      }
    }
  } catch (error) {
    console.error("Error checking request:", error);
  }

  return { cancel: false };
}

// Listen for browser startup
chrome.runtime.onStartup.addListener(function () {
  console.log("Browser started");
  loadSettings();
});

// Listen for back button click
document.addEventListener("DOMContentLoaded", function () {
  console.log("Blocked view loaded");

  var backBtn = document.getElementById("backBtn");

  backBtn.addEventListener("click", function () {
    console.log("Back button clicked");

    try {
      if (window.history.length > 1) {
        console.log("Go back 2");
        window.history.go(-2);
      }
    } catch (error) {
      console.error("Error navigating back:", error);
    }

    // As a fallback option, try closing the tab
    setTimeout(function () {
      console.log("Attempting fallback: try to close tab");
      try {
        window.close();
      } catch (error) {
        console.error("Could not close tab:", error);
      }
    }, 300);
  });
});
