let isBlocking = false;
let blockedSites = [];

chrome.runtime.onInstalled.addListener(function () {
  console.log("Distraction Block installed");
  loadSettings();
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "updateBlocking") {
    blockedSites = message.blockedSites || [];
    isBlocking = message.isBlocking;

    console.log("Updated blocking settings:", { isBlocking, blockedSites });

    setupBlocker();
    sendResponse({ success: true });
  }
});

function loadSettings() {
  chrome.storage.sync.get(["blockedSites", "isBlocking"], function (result) {
    blockedSites = result.blockedSites || [];
    isBlocking = result.isBlocking || false;

    console.log("Loaded settings:", { isBlocking, blockedSites });

    setupBlocker();
  });
}

function setupBlocker() {
  // if (chrome.webRequest.onBeforeRequest.hasListener(checkRequest)) {
  //   chrome.webRequest.onBeforeRequest.removeListener(checkRequest);
  // }
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

chrome.runtime.onStartup.addListener(function () {
  console.log("Browser started");
  loadSettings();
});

document.addEventListener("DOMContentLoaded", function () {
  console.log("Blocked view loaded");

  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      console.log("Back button clicked");

      try {
        if (window.history.length > 1) {
          console.log("Going back in history");
          window.history.go(-2);
        }
      } catch (error) {
        console.error("Error navigating back:", error);
      }

      setTimeout(function () {
        console.log("Attempting fallback: try to close tab");
        try {
          window.close();
        } catch (error) {
          console.error("Could not close tab:", error);
        }
      }, 300);
    });
  }
});
