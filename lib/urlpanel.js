// Include modules
const Self = require('sdk/self');
const StylesheetUtils = require('sdk/stylesheet/utils');
const Windows = require('sdk/windows').browserWindows;
const { viewFor } = require('sdk/view/core');

// Declare XUL namesparec
const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

// Declare url panel event listeners
var listeners = {
	popupshowing: [
		fixPanelWidth
	],
	popupshown: [],
	popuphidden: [],
	click: [],
	dblclick: []
};

/**
 * Attach listener on urlbar event type.
 * @param	event		The event type.
 * @param	listeners	The listener to attach.
 */
function on (event, listener) {
	// Check listener
	if (typeof listener !== 'function') {
		console.warn('The listener is not a function.');
		return;
	}
	// Check event type
	if (!Array.isArray(listeners[event])) {
		console.warn('The event type '+event+' is not supported.');
		return;
	}
	// Register listener
	listeners[event].push(listener);
}

/**
 * Notify listeners of an event.
 * @param	eventType	The type of event to notify.
 * @param	event		The event to notify.
 */
function notifyListeners (eventType, event) {
	// Declare result
	var result = undefined;
	// Notify each listener
	for (let listener of listeners[eventType]) {
		// Notify listener with the event
		var listenerResult = listener(event);
		// Check listener result
		if (typeof listenerResult !== 'undefined') {
			// Update result
			result = listenerResult;
		}
	}
	// Check if result is defined
	if (typeof result !== 'undefined') {
		// Result result
		return result;
	}
}

/**
 * Fix panel width.
 * @param	event		The event.
 * @return				True to continue event cause.
 */
function fixPanelWidth (event) {
	// Get document
	var document = event.panel.ownerDocument;
	// Get the urlbar element
	var urlbar = document.getElementById('urlbar');
	// Fix urlpanel width
	event.panel.width = urlbar.scrollWidth;
	// Continue event cause
	return true;
}

/**
 * Open the url panel.
 * @param	browserWindow	The browser window to open url panel.
 */
function open (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get the url panel element
	var panel = document.getElementById('scrollupfolderUrlsPanel');
	// Get the urlbar element
	var urlbar = document.getElementById('urlbar');
	// Check if awesomebar popup is opened
	if (urlbar.popup.state == 'open') {
		// Close the awesomebar popup
		urlbar.popup.hidePopup();
	}
	// Open the url panel
	panel.openPopup(urlbar, 'after_start', 0, 0, false, false);
}

/**
 * Close the url panel.
 * @param	browserWindow	The browser window to close url panel.
 */
function close (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get the url panel element
	var panel = document.getElementById('scrollupfolderUrlsPanel');
	// Hide the url panel
	panel.hidePopup();
}

/**
 * Check if the url panel is opened.
 * @param	browserWindow	The browser window check if  the url panel is opened.
 * @Return					true if the url panel is opened, false otherwise.
 */
function isOpened (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get the url panel element
	var panel = document.getElementById('scrollupfolderUrlsPanel');
	// Return panel open status
	return panel.state === 'open';
}

/**
 * Select the upper item in listbox.
 * @param	browserWindow	The browser window to select the upper item.
 * @return					The selected item label, null if no selected item.
 */
function selectUpperItem (browserWindow) {
	return selectItem(browserWindow, -1);
}

/**
 * Select the down item in listbox.
 * @param	browserWindow	The browser window to select the down item.
 * @return					The selected item label, null if no selected item.
 */
function selectDownItem (browserWindow) {
	return selectItem(browserWindow, 1);
}

/**
 * Select the an item near to the currently selected in listbox.
 * @param	browserWindow	The browser window to select item.
 * @param	indexIncrement	The selection index increment to apply.
 * @return					The selected item label, null if no selected item.
 */
function selectItem (browserWindow, indexIncrement) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get listbox element
	var listbox = document.getElementById('scrollupfolderUrlsListbox');
	// Get the selected item
	var selectedItem = listbox.getSelectedItem(0);
	// Check selected item
	if (selectedItem == null) {
		return null;
	}
	// Get selected item index
	var selectedItemIdex = listbox.getIndexOfItem(selectedItem);
	// Compute new item index
	var newItemIndex = selectedItemIdex+indexIncrement;
	// Check new item index
	if (newItemIndex < 0 || newItemIndex >= listbox.getRowCount())
		return selectedItem.label;
	// Get the new item
	var item = listbox.getItemAtIndex(newItemIndex);
	// Select the new item
	listbox.selectItem(item);
	// Return the new item label
	return item.label;
}

/**
 * Get the selected item in listbox.
 * @param	browserWindow	The browser window to get selected item.
 * @return					The selected item label, null if no selected item.
 */
function getSelectedItem (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get listbox element
	var listbox = document.getElementById('scrollupfolderUrlsListbox');
	// Get the selected item
	var selectedItem = listbox.getSelectedItem(0);
	// Check selected item
	if (selectedItem == null) {
		return null;
	}
	// Return the selected item label
	return selectedItem.label;
}

/**
 * Initilize the url panel of a browser window.
 * @param	browserWindow	The browser window to initialize url panel.
 */
function initialize (browserWindow) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Load stylesheet into window
	StylesheetUtils.loadSheet(window, Self.data.url('styles/urlpanel.css'));
	// Create panel
	var panel = document.createElementNS(NS_XUL, 'panel');
	panel.setAttribute('id', 'scrollupfolderUrlsPanel');
	panel.setAttribute('position', 'after_start');
	panel.setAttribute('noautofocus', 'true');
	// Create listbox
	var listbox = document.createElementNS(NS_XUL, 'listbox');
	listbox.setAttribute('id', 'scrollupfolderUrlsListbox');
	listbox.setAttribute('flex', '1');
	// Add listbox to panel
	panel.appendChild(listbox);
	// Add event listener for each type of event
	for (var type in listeners) {
		// Create temporay function to fix the scope
		function fixScope(eventType) {	
			// Add event listener
			panel.addEventListener(eventType, function (event) {
				// event event context
				event.panel = panel;
				event.listbox = listbox;
				// Notify listeners
				notifyListeners(eventType, event);
			}, true);
		};
		// Call temporary function
		fixScope(type);
	}
	// Get mainPopupSet element
	var mainPopupSet = document.getElementById('mainPopupSet');
	// Add panel to mainPopupSet
	mainPopupSet.appendChild(panel);
}

// Initialize opened browser windows
for (let browserWindow of Windows) {
	initialize(browserWindow);
}
// Add open browser window event handling for initialization
Windows.on('open', initialize);

// Export public API
exports.on = on;
exports.open = open;
exports.close = close;
exports.isOpened = isOpened;
exports.selectUpperItem = selectUpperItem;
exports.selectDownItem = selectDownItem;
exports.getSelectedItem = getSelectedItem;