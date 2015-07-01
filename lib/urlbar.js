// Include modules
const Unload = require('sdk/system/unload');
const Windows = require('sdk/windows').browserWindows;
const { viewFor } = require('sdk/view/core');
// Include eventmanager module
const EventManager = require('eventmanager');

/**
 * Attach listener on urlbar event type.
 * @param	eventType	The event type.
 * @param	listeners	The listener to attach.
 */
function on (eventType, listener) {
	// Register listener
	EventManager.register(eventType, listener);
}

/**
 * Get the urlbar URL.
 * @param	browserWindow	The browser window to get urlbar URL.
 * @return					The urlbar URL of the given browser window.
 */
function getUrl (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get the urlbar element
	var urlbar = document.getElementById('urlbar');
	// Get the URL
	return urlbar.value;
}

/**
 * Set the urlbar URL of a browser window.
 * @param	browserWindow	The browser window to set urlbar URL.
 * @param	url				The URL to set.
 * @param	focus			true to request focus (optional).
 */
function setUrl (browserWindow, url, focus) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get the urlbar element
	var urlbar = document.getElementById('urlbar');
	// Set the URL
	urlbar.value = url;
	// Check focus request
	if (focus) {
		// Request focus
		urlbar.focus();
	}
	// Set the cursor at the end of path
	urlbar.setSelectionRange(url.length, url.length);
}

/**
 * Start input in urlbar of a browser window.
 * @param	browserWindow	The browser window to start input in urlbar.
 */
function startInput (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get the urlbar element
	var urlbar = document.getElementById('urlbar');
	// Set the cursor at the end of the url
	var positionCursor = urlbar.value.length;
	urlbar.setSelectionRange(positionCursor, positionCursor);
	// Request focus
	urlbar.focus();
}

/**
 * Initialize the urlbar behavior of a browser window.
 * @param	browserWindow	The browser window to initialize urlbar behavior.
 */
function initialize (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get urlbar-container element
	var urlbar_container = document.getElementById('urlbar-container');
	// Get urlbar element
	var urlbar = document.getElementById('urlbar');
	// Attach scrolling event listeners on urlbar-container
	EventManager.attach(urlbar_container, ['DOMMouseScroll']);
	// Attach click, key down and key up event listeners on urlbar
	EventManager.attach(urlbar, ['click', 'keydown', 'keyup']);
}

/**
 * Clean the urlbar behavior of a browser window.
 * @param	browserWindow	The browser window to clean urlbar behavior.
 */
function clean (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get urlbar-container element
	var urlbar_container = document.getElementById('urlbar-container');
	// Get urlbar element
	var urlbar = document.getElementById('urlbar');
	// Detach scrolling event listeners on urlbar-container
	EventManager.detach(urlbar_container, ['DOMMouseScroll']);
	// Detach click, key down and key up event listeners on urlbar
	EventManager.detach(urlbar, ['click', 'keydown', 'keyup']);
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
exports.getUrl = getUrl;
exports.setUrl = setUrl;
exports.startInput = startInput;
