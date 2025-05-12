// browser-polyfill.js
(function () {
  // Define the browser object if it doesn't exist
  window.browser = window.browser || window.chrome;

  // If we're in Firefox, this is already defined correctly
  // If we're in Chrome, we need to polyfill it
  if (
    typeof window.browser !== "object" ||
    typeof window.browser.runtime !== "object"
  ) {
    window.browser = {};

    // Copy Chrome APIs to the browser namespace
    for (const api of ["storage", "runtime", "tabs", "webNavigation"]) {
      if (chrome[api]) {
        window.browser[api] = {};
        for (const method in chrome[api]) {
          if (typeof chrome[api][method] === "function") {
            // Convert callback-based APIs to Promise-based
            window.browser[api][method] = function (...args) {
              return new Promise((resolve, reject) => {
                chrome[api][method](...args, function (result) {
                  if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                  } else {
                    resolve(result);
                  }
                });
              });
            };
          } else {
            window.browser[api][method] = chrome[api][method];
          }
        }
      }
    }
  }
})();
