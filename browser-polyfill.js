// This script provides a compatibility layer for cross-browser extensions
(function () {
  // Use the browser API for Firefox or the chrome API for Chrome
  window.browser = (function () {
    return typeof browser !== "undefined" ? browser : chrome;
  })();
})();
