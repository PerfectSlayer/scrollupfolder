// Include modules
const L10n = require("sdk/l10n");
const Self = require('sdk/self');
const SimplePrefs = require('sdk/simple-prefs');
const StylesheetUtils = require('sdk/stylesheet/utils');
const Unload = require('sdk/system/unload');
const Windows = require('sdk/windows').browserWindows;
const { viewFor } = require('sdk/view/core');
// Include eventmanager module
const EventManagerModule = require('eventmanager');
const EventManager = new EventManagerModule.EventManager('click');

// Declare XUL namespace
const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

/**
 * Attach listener on URL button event type.
 * @param	eventType	The event type.
 * @param	listeners	The listener to attach.
 */
function on (eventType, listener) {
	// Register listener
	EventManager.register(eventType, listener);
}

/**
 * Mark the URL button as opened.
 * @param	browserWindow	The browser window to mark the URL button as opened.
 */
function markOpened (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get the URL button element
	var button = document.getElementById('fr_hardcoding_scrollupfolder_urlbar_button');
	// Mark the button as open
	button.setAttribute('open', 'true');
}

/**
 * Mark the URL button as opened.
 * @param	browserWindow	The browser window to mark the URL button as opened.
 */
function markClosed (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get the URL button element
	var button = document.getElementById('fr_hardcoding_scrollupfolder_urlbar_button');
	// Mark the button as open
	button.setAttribute('open', 'false');
}

/**
 * Initialize the urlbar button of a browser window.
 * @param	browserWindow	The browser window to initialize urlbar button.
 */
function initialize (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Load stylesheet into window
	StylesheetUtils.loadSheet(window, Self.data.url('styles/urlbutton.css'));
	// Create button
	var button = document.createElementNS(NS_XUL, 'image');
	button.setAttribute('id', 'fr_hardcoding_scrollupfolder_urlbar_button');
	button.setAttribute('class', 'urlbar-icon');
	button.setAttribute('open', 'false');
	button.setAttribute('tooltiptext', L10n.get('button_tooltip'));
	button.setAttribute('hidden', !SimplePrefs.prefs.showButton);
	// Attach event listeners on button
	EventManager.attach(button);
	// Bind on preferences event
	SimplePrefs.on('showButton', function () {
		button.setAttribute('hidden', !SimplePrefs.prefs.showButton)
	});
	// Get urlbar-icons element
	var urlbar_icons = document.getElementById('urlbar-icons');
	// Get go-button element
	urlbar_icons.appendChild(button);
}

/**
 * Clean the urlbar button of a browser window.
 * @param	browserWindow	The browser window to clean urlbar button.
 */
function clean (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Remove stylesheet from window
	StylesheetUtils.removeSheet(window, Self.data.url('styles/urlbutton.css'));
	// Get urlbar button
	var button = document.getElementById('fr_hardcoding_scrollupfolder_urlbar_button');
	// Remove the button from the urlbar icons
	button.remove();
}

// Initialize opened browser windows
for (let browserWindow of Windows) {
	initialize(browserWindow);
}
// Add open browser window event handling for initialization
Windows.on('open', initialize);

// Register unload callback
Unload.when(function () {
	// Clean each browser window
	for (let browserWindow of Windows) {
		clean(browserWindow);
	}
});

// Export public API
exports.on = on;
exports.markOpened = markOpened;
exports.markClosed = markClosed;
