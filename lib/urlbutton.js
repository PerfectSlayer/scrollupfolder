// Include modules
const Self = require('sdk/self');
const SimplePrefs = require('sdk/simple-prefs');
const StylesheetUtils = require('sdk/stylesheet/utils');
const Windows = require('sdk/windows').browserWindows;
const { viewFor } = require('sdk/view/core');

// Declare XUL namesparec
const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

// Declare urlbutton event listeners
var clickListeners = [];

/**
 * Attach listener on URL bar event type.
 * @param	event		The event type.
 * @param	listeners	The listener to attach.
 */
function on (event, listener) {
	// Check listener
	if (!listener)
		return;
	// Check event type
	if (event === 'click') {
		clickListeners.push(listener);
	} else {
		console.warn('The event type '+event+' is not supported.');
	}
}

/**
 * Notify listeners of an event.
 * @param	listeners	The listener collection to notify.
 * @param	event		The event to notify.
 */
function notifyListeners (listeners, event) {
	// Notify each listener
	for (let listener of listeners) {
		// Notify listener with the event
		listener(event);
	}
}

/**
 * Initilize the urlbar behavior of a browser window.
 * @param	browserWindow	The browser window to initialize urlbar behavior.
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
	button.setAttribute('tooltiptext', 'TODO');	// TODO Fix tooltip with i18n string
	button.setAttribute('hidden', !SimplePrefs.prefs.showButton);
	// Add button event handling
	button.addEventListener('click', function (event) {
		notifyListeners(clickListeners, event)
	}, true);
	// Bind on preferences event
	SimplePrefs.on('showButton', function () {
		button.setAttribute('hidden', !SimplePrefs.prefs.showButton)
	});
	// Get urlbar-icons element
	var urlbar_icons = document.getElementById('urlbar-icons');
	// Get go-button element
	urlbar_icons.appendChild(button);
}

// Initialize opened browser windows
for (let browserWindow of Windows) {
	initialize(browserWindow);
}
// Add open browser window event handling for initialization
Windows.on('open', initialize);

// Export public API
exports.on = on;