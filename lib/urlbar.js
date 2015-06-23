// Include modules
const Windows = require('sdk/windows').browserWindows;
const { viewFor } = require('sdk/view/core');

// Declare urlbar event listeners
var scrollListeners = [];
var clickListeners = [];
var keyDownListeners = [];
var keyUpListeners = [];

/**
 * Attach listener on urlbar event type.
 * @param	event		The event type.
 * @param	listeners	The listener to attach.
 */
function on (event, listener) {
	// Check listener
	if (!listener)
		return;
	// Check event type
	if (event === 'scroll') {
		scrollListeners.push(listener);
	} else if (event === 'click') {
		clickListeners.push(listener);
	} else if (event === 'keyDown') {
		keyDownListeners.push(listener);
	} else if (event === 'keyUp') {
		keyUpListeners.push(listener);
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
 * Initilize the urlbar behavior of a browser window.
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
	// Add scrolling event handling on urlbar-container
	urlbar_container.addEventListener('DOMMouseScroll', function(event) {
		notifyListeners(scrollListeners, event)
	}, true);
	// Add clicking event handling on urlbar
	urlbar.addEventListener('click', function(event) {
		notifyListeners(clickListeners, event)
	}, true);
	// Add key pressing down handling event on urlbar
	urlbar.addEventListener('keydown', function(event) {
		notifyListeners(keyDownListeners, event)
	}, true);
	// Add key pressing up event handling on urlbar
	urlbar.addEventListener('keyup', function(event) {
		notifyListeners(keyUpListeners, event)
	}, true);
}

// Initialize opened browser windows
for (let browserWindow of Windows) {
	initialize(browserWindow);
}
// Add open browser window event handling for initialization
Windows.on('open', initialize);

// Export public API
exports.on = on;
exports.getUrl = getUrl;
exports.setUrl = setUrl;
exports.startInput = startInput;