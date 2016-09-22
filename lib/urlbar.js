// Include modules
const Unload = require('sdk/system/unload');
const ViewFor = require('sdk/view/core').viewFor;
const Windows = require('sdk/windows').browserWindows;
// Include eventmanager module
const EventManagerModule = require('lib/eventmanager');
const BarEventManager = new EventManagerModule.EventManager('click', 'keydown', 'keyup');
const ContainerEventManager = new EventManagerModule.EventManager('DOMMouseScroll');

/**
 * Attach listener on urlbar event type.
 * @param	eventType	The event type.
 * @param	listeners	The listener to attach.
 */
function on(eventType, listener) {
	// Check event type
	if (eventType === 'DOMMouseScroll') {
		// Register listener on contrainer event manager
		ContainerEventManager.register(eventType, listener);
	} else {
		// Register listener on bar event manager
		BarEventManager.register(eventType, listener);
	}
}

/**
 * Get the urlbar URL of a tab.
 * @param	tab		The tab to get urlbar URL.
 * @return			The urlbar URL of the given browser window.
 */
function getUrl(tab) {
	// Convert tab to chrome window
	let window = ViewFor(tab.window);
	// Get document
	let document = window.document;
	// Get the urlbar element
	let urlbar = document.getElementById('urlbar');
	// Return the urlbar URL
	return urlbar.value;
}

/**
 * Set the urlbar URL of a tab.
 * @param	tab		The tab to set urlbar URL.
 * @param	url		The URL to set.
 */
function setUrl(tab, url) {
	// Check URL
	if (!url) {
		return;
	}
	// Convert tab to chrome window
	let window = ViewFor(tab.window);
	// Get document
	let document = window.document;
	// Get the urlbar element
	let urlbar = document.getElementById('urlbar');
	// Set the URL
	// Check if URL to set is the same as tab URL
	if (tab.url === url) {
		// Revert urlbar edition
		urlbar.handleRevert();
	} else {
		// Edit the urlbar location (using textValue instead of value)
		urlbar.textValue = url;
	}
	// Set the cursor at the end of path
	urlbar.setSelectionRange(url.length, url.length);
}

/**
 * Start input in urlbar of a tab.
 * @param	tab		The tab to start input.
 */
function startInput(tab) {
	// Convert tab to chrome window
	let window = ViewFor(tab.window);
	// Get document
	let document = window.document;
	// Get the urlbar element
	let urlbar = document.getElementById('urlbar');
	// Request focus
	urlbar.focus();
	// Check if uRL is defined
	let url = urlbar.textValue;
	if (url) {
		// Set the cursor at the end of the url
		urlbar.setSelectionRange(url.length, url.length);
	}
}

/**
 * Initialize the urlbar behavior of a browser window.
 * @param	browserWindow	The browser window to initialize urlbar behavior.
 */
function initialize(browserWindow) {
	// Convert to chrome window
	let window = ViewFor(browserWindow);
	// Get document
	let document = window.document;
	// Get urlbar-container element
	let urlbar_container = document.getElementById('urlbar-container');
	// Get urlbar element
	let urlbar = document.getElementById('urlbar');
	// Attach event listeners on urlbar-container
	ContainerEventManager.attach(urlbar_container);
	// Attach event listeners on urlbar
	BarEventManager.attach(urlbar);
}

/**
 * Clean the urlbar behavior of a browser window.
 * @param	browserWindow	The browser window to clean urlbar behavior.
 */
function clean(browserWindow) {
	// Convert to chrome window
	let window = ViewFor(browserWindow);
	// Get document
	let document = window.document;
	// Get urlbar-container element
	let urlbar_container = document.getElementById('urlbar-container');
	// Get urlbar element
	let urlbar = document.getElementById('urlbar');
	// Detach event listeners on urlbar-container
	ContainerEventManager.detach(urlbar_container);
	// Detach event listeners on urlbar
	BarEventManager.detach(urlbar);
}

// Initialize opened browser windows
for (let browserWindow of Windows) {
	initialize(browserWindow);
}
// Add open browser window event handling for initialization
Windows.on('open', initialize);

// Register unload callback
Unload.when(function() {
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
