# Distraction Block Browser Extension

A browser extension for Chrome and Firefox that helps you stay focused by blocking distracting websites.

## Features

- Block specific websites that distract you
- Simple on/off toggle to enable or disable blocking
- Works across Chrome and Firefox browsers

## Privacy Policy

We take your privacy seriously. This extension does not collect any personal data. All settings are stored locally in your browser.

- [Read our full Privacy Policy](privacy.html)

## Installation

### Chrome

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right
4. Click "Load unpacked" and select the folder containing this extension
5. The extension should now appear in your toolbar

### Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select any file in the extension folder (e.g., manifest.json)
5. The extension should now appear in your toolbar

## Usage

1. Click on the extension icon in your browser toolbar to open the popup
2. Add websites you want to block by entering their domain (e.g., `facebook.com`, `twitter.com`)
3. Click "Add" to save the website or the "X" to remove it
4. Toggle the "Blocking Mode" switch to enable or disable blocking

If you try to access a blocked website when blocking is enabled, you'll see a block page with two options:

- "Go Back" - Returns to the previous page
- "Override Block (5 min)" - Temporarily allows access to the blocked site for 5 minutes

## Project Structure

- `manifest.json` - Extension configuration
- `popup.html`, `popup.css`, `popup.js` - User interface for controlling the extension
- `background.js` - Background script that handles the blocking logic
- `blocked.html`, `blocked.js` - Block page shown when a user tries to access a blocked site

## Development

To modify this extension:

1. Make your changes to the relevant files
2. For Chrome, go to `chrome://extensions/` and click the refresh icon on the extension
3. For Firefox, reinstall the extension as described in the installation section

## Future Improvements

- Add block scheduling (e.g., block sites only during work hours)
- Support for blocking specific paths within a domain
- Add productivity statistics tracking
- Create a settings page for advanced configurations

## License

This project is licensed under the _GNU GPL v3 License_ - see the [LICENSE](LICENSE.md) file for details.
