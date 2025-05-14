const fs = require("fs");
const path = require("path");

const sourceDir = path.join(__dirname, "src");
const buildDir = path.join(__dirname, "build");
const chromeDir = path.join(buildDir, "chrome");
const firefoxDir = path.join(buildDir, "firefox");

// Clear the build directory if it exists
if (fs.existsSync(buildDir)) {
  console.log("Removing existing build directory...");
  fs.rmSync(buildDir, { recursive: true, force: true });
  console.log("Old build directory removed successfully");
}

// Create fresh directories
console.log("\nCreating new build directories... 🛠️");
fs.mkdirSync(buildDir);
fs.mkdirSync(chromeDir);
fs.mkdirSync(firefoxDir);

const commonFiles = [
  "popup.html",
  "popup.js",
  "popup.css",
  "background.js",
  "blocked.html",
  "blocked.js",
  "browser-polyfill.js",
  "service-worker.js",
  "privacy.html",
];

function copyIcons(targetDir) {
  const iconsDir = path.join(targetDir, "icons");
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

  try {
    const icons = fs.readdirSync(path.join(sourceDir, "icons"));
    icons.forEach((icon) => {
      fs.copyFileSync(
        path.join(sourceDir, "icons", icon),
        path.join(iconsDir, icon),
      );
    });
    console.log(`  Copied icons to ${targetDir}`);
  } catch (err) {
    console.error(`Error copying icons: ${err.message}`);
  }
}

commonFiles.forEach((file) => {
  try {
    if (fs.existsSync(path.join(sourceDir, file))) {
      fs.copyFileSync(path.join(sourceDir, file), path.join(chromeDir, file));
      fs.copyFileSync(path.join(sourceDir, file), path.join(firefoxDir, file));
      console.log(`  Copied ${file} to build directories`);
    }
  } catch (err) {
    console.error(`Error copying ${file}: ${err.message}`);
  }
});

try {
  fs.copyFileSync(
    path.join(sourceDir, "manifest-chrome.json"),
    path.join(chromeDir, "manifest.json"),
  );
  fs.copyFileSync(
    path.join(sourceDir, "manifest-firefox.json"),
    path.join(firefoxDir, "manifest.json"),
  );
  console.log("  Copied browser-specific manifest files");
} catch (err) {
  console.error(`Error copying manifest files: ${err.message}`);
}

copyIcons(chromeDir);
copyIcons(firefoxDir);

console.log("\nBuild completed successfully! ✅");
console.log(`  Chrome extension: ${chromeDir}`);
console.log(`  Firefox extension: ${firefoxDir}`);
