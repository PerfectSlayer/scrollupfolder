// Include modules
const Self = require('sdk/self');
const StylesheetUtils = require('sdk/stylesheet/utils');
const Unload = require('sdk/system/unload');
const Windows = require('sdk/windows').browserWindows;
const { viewFor } = require('sdk/view/core');
// Include eventmanager module
const EventManagerModule = require('eventmanager');
const EventManager = new EventManagerModule.EventManager('popupshowing', 'popupshown', 'popuphidden', 'click', 'dblclick');

// Declare XUL namespace
const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

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
 * Fix panel width.
 * @param	event		The event.
 * @return				True to continue event cause.
 */
function fixPanelWidth (event) {
	// Get document
	var document = event.target.ownerDocument;
	// Get the urlbar element
	var urlbar = document.getElementById('urlbar');
	// Get the url panel element
	var panel = document.getElementById('scrollupfolderUrlsPanel');
	// Fix urlpanel width
	panel.width = urlbar.scrollWidth;
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
 * @param	browserWindow	The browser window to check if the url panel is opened.
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
 * Set the items of the url panel.
 * @param	browserWindow	The browser window to set the url panel items.
 * @param	items			The items to set to the url panel.
 */
function setItems (browserWindow, items) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get listbox element
	var listbox = document.getElementById('scrollupfolderUrlsListbox');
	// Remove current items
	while(listbox.getRowCount() > 0) {
		listbox.removeItemAt(0);
	}
	// Append each item
	for (var item of items) {
		listbox.appendItem(item);
	}
	// Fix listbox size
	var rows = listbox.getRowCount();
	if (rows !== 0) {
		listbox.setAttribute('rows', rows);
	}
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
	if (newItemIndex < 0 || newItemIndex >= listbox.getRowCount()) {
		return selectedItem.label;
	}
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
 * Get the selected item index in listbox.
 * @param	browserWindow	The browser window to get selected item index.
 * @return					The selected item label, -1 if no selected item index.
 */
function getSelectedIndex (browserWindow) {
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
		return -1;
	}
	// Get selected item index
	return listbox.getIndexOfItem(selectedItem);
}

/**
 * Set the selected item index in listbox.
 * @param	browserWindow	The browser window to set selected item index.
 * @param	param			The selected item index to set.
 */
function setSelectedIndex (browserWindow, index) {
	// Convert to chrome window
	var window = viewFor(browserWindow);
	// Get document
	var document = window.document;
	// Get listbox element
	var listbox = document.getElementById('scrollupfolderUrlsListbox');
	// Check new item index
	if (index < 0 || index >= listbox.getRowCount()) {
		return;
	}
	// Get the new selected item
	var item = listbox.getItemAtIndex(index);
	// Select the new selected item
	listbox.selectItem(item);
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
	// Attach event listeners on panel
	EventManager.attach(panel);
	// Get mainPopupSet element
	var mainPopupSet = document.getElementById('mainPopupSet');
	// Add panel to mainPopupSet element
	mainPopupSet.appendChild(panel);
	// Get the urlbar element
	var urlbar = document.getElementById('urlbar');
	/*
	 * Note for reviewer: I have to hack openPopup method because I can't block panel opening
	 * with "onpopupshowing" method or "popupshowing" event without breaking the awesomebar.
	 * If I prevent the opening at least one tine, the awesomebar will never show up again.
	 */
	// Save default openPopup method
	urlbar.popup.SUFOpenPopup = urlbar.popup.openPopup;
	// Decorate openPopup method
	urlbar.popup.openPopup = function (anchor, position, x, y, isContextMenu, attributesOverride) {
		// Check if panel is open
		if (panel.state === 'open') {
			return;
		}
		// Delegate to saved default open method
		urlbar.popup.SUFOpenPopup(anchor, position, x, y, isContextMenu, attributesOverride);
	}
}

/**
 * Clean the url panel of a browser window.
 * @param	browserWindow	The browser window to clean url panel.
 */
function clean (browserWindow) {
		// Convert to chrome window
		var window = viewFor(browserWindow);
		// Get document
		var document = window.document;
		// Get the urlbar element
		var urlbar = document.getElementById('urlbar');
		// Restore default openPopup method
		urlbar.popup.openPopup = urlbar.popup.SUFOpenPopup;
		// Clear default openPopup method method save
		delete urlbar.popup.SUFOpenPopup;
		// Remove stylesheet from window
		StylesheetUtils.removeSheet(window, Self.data.url('styles/urlpanel.css'));
		// Get panel
		var panel = document.getElementById('scrollupfolderUrlsPanel');
		// Remove panel from mainPopupSet element
		panel.remove();
}

// Register popup showing default listener
EventManager.register('popupshowing', fixPanelWidth);

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
exports.open = open;
exports.close = close;
exports.isOpened = isOpened;
exports.setItems = setItems
exports.selectUpperItem = selectUpperItem;
exports.selectDownItem = selectDownItem;
exports.getSelectedItem = getSelectedItem;
exports.getSelectedIndex = getSelectedIndex;
exports.setSelectedIndex = setSelectedIndex;
