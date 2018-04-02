/*
 * Declare settings.
 */
// Declare display urlbar icon settings (true if displayed, false otherwise)
var displayUrlbarIcon = false;
// Declare enable shortcuts settings (true if enabled, false otherwise)
var enableShortcuts = false;
// Declare parse anchor in URL settings (true if parsed, false otherwise)
var parseAnchor = true;
// Declare parse GET variables in URL settings (true if parsed, false otherwise)
var parseGetVariables = true;
// Declare parse domain in URL settings (true if parsed, false otherwise)
var parseDomain = true;
// Bind storage change listener
browser.storage.onChanged.addListener((changes, area) => {
	// Check settings change
	if (!changes.settings) {
		return;
	}
	// Apply new settings
	applySettings(changes.settings.newValue);
});
/**
 * Apply the settings.
 * @param settings The settings to apply.
 */
function applySettings(settings) {
	// Update current settings
	displayUrlbarIcon = !settings.hasOwnProperty('displayUrlbarIcon') || settings.displayUrlbarIcon;
	enableShortcuts = !settings.hasOwnProperty('enableShortcuts') || settings.enableShortcuts;
	parseAnchor = !settings.hasOwnProperty('parseAnchor') || settings.parseAnchor;
	parseGetVariables = !settings.hasOwnProperty('parseGetVariables') || settings.parseGetVariables;
	parseDomain = !settings.hasOwnProperty('parseDomain') || settings.parseDomain;
	// Clear URLs cache
	urlCache = {};
	// Update urlbar icon
	browser.tabs.query({}).then(tabs => {
		for (let tab of tabs) {
			updateUrlbarIcon(tab);
		}
	});
}
/**
 * Load the settings.
 */
function loadSettings() {
	// Get the user settings (defining default options otherwise)
	browser.storage.sync.get({
		"settings": {
			displayUrlbarIcon: true,
			enableShortcuts: true,
			parseAnchor: true,
			parseGetVariables: true,
			parseDomain: true
		}
	}).then(result => {
		applySettings(result.settings);
	}, error => {
		console.error("Unable to load settings: " + error);
	});
}

/*
 * Declare URL management.
 */
// Declare URLs cache (indexed by tab id)
var urlCache = {};
/**
 * Get the current tab of the current window.
 * @return A premise that will return the current tab of the current window.
 */
function getCurrentTab() {
	// Query active tab of the active window
	var querying = browser.tabs.query({
		currentWindow: true,
		active: true
	});
	// Extract the first tab of the tab array
	var extractFirstTab = tabs => new Promise((resolve, reject) => {
		if (tabs.length < 1) {
			reject('Current tab not found');
		} else {
			resolve(tabs[0]);
		}
	});
	// Return combine promise
	return querying.then(extractFirstTab);
}
/**
 * Load an URL into a tab.
 * @param tab The tab to load URL into.
 * @param url The URL to load.
 */
function loadUrl(tab, url) {
	console.log("Load URL: " + url);
	browser.tabs.update(tab.id, {
		"url": url
	});
}
/**
 * Get URLs of a tab.
 * @param tab The tab to compute URLs.
 * @param callback The callback to send result.
 */
function getUrls(tab) {
	console.log("getUrls");
	// Get current tab id
	var tabId = tab.id;
	// Get current URL
	var url = tab.url;
	// Check cached URLs
	if (!urlCache[tabId]) {
		// Create cache
		urlCache[tabId] = computeFolders(url);
	}
	// Compute selected index
	var selected = urlCache[tabId].indexOf(url);
	if (selected === -1) {
		// Update invalid cache
		urlCache[tabId] = computeFolders(url);
		selected = 0;
	}
	// Notify callback
	return {
		"return": "get-urls",
		"tabId": tabId,
		"urls": urlCache[tabId],
		"selected": selected
	};
}
/**
 * Delete URLs of a tab.
 * @param tabId The tab identifier to remove cache.
 */
function deleteUrls(tabId) {
	delete urlCache.tabId;
}
// Bind tab remove listener
browser.tabs.onRemoved.addListener(deleteUrls);

/*
 * Declare messaging between add-on parts.
 */
/**
 * Handle runtime messages.
 * @param request The message request.
 * @param sender The message sender.
 * @param sendResponse The sender callback.
 * @return true to keep callback alive for async response, false otherwise.
 */
function handleMessage(request, sender, sendResponse) {
	console.log("Message received");
	console.log(request);
	switch (request.message) {
		case 'get-urls':
			getCurrentTab().then(getUrls).then(sendResponse);
			return true;
		case 'set-url':
			getCurrentTab().then(tab => loadUrl(tab, request.url));
			return false;
		default:
			return false;
	}
}
// Bind message listener
browser.runtime.onMessage.addListener(handleMessage);

/*
 * Declare page action behavior.
 */
/**
 * Update urlbar icon.
 * @param tab The tab to update the icon.
 */
function updateUrlbarIcon(tab) {
	console.log("Tab update " + tab.id);
	// Check feature status and tab URL
	if (displayUrlbarIcon && tab.url && tab.url.substr(0, 6) !== 'about:') {
		browser.pageAction.show(tab.id);
	} else {
		browser.pageAction.hide(tab.id);
	}
}
// Bind tab update listener
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => updateUrlbarIcon(tab));

/*
 * Declare commands behavior.
 */
// Bind command listener
browser.commands.onCommand.addListener(command => {
	// Check feature status
	if (!enableShortcuts) {
		return;
	}
	// Declare function to compute URL to load from tab URLs.
	var computeUrlFunction;
	// Check the command
	switch (command) {
		case "browse-to-top":
			console.log("Browse to top command");
			computeUrlFunction = tab => tab.urls[0];
			break;
		case "browse-up":
			console.log("Browse up command");
			computeUrlFunction = tab => tab.urls[Math.max(tab.selected - 1, 0)];
			break;
		case "browse-down":
			console.log("Browse down command");
			computeUrlFunction = tab => tab.urls[Math.min(tab.selected + 1, tab.urls.length - 1)];
			break;
		case "browse-to-bottom":
			console.log("Browse to bottom command");
			computeUrlFunction = tab => tab.urls[tab.urls.length - 1];
			break;
	}
	// Check fuction
	if (computeUrlFunction) {
		// Load the computed URL
		getCurrentTab().then(tab => {
			// Compute URL to load
			var url = computeUrlFunction(getUrls(tab));
			// Load URL to current tab
			loadUrl(tab, url);
		});
	}
});

/*
 * Declare welcome behavior.
 */
// Bind runtine installation listener
browser.runtime.onInstalled.addListener(details => {
	// Check temporary installation
	if (details.temporary) {
		return;
	}
	// Declare the welcome URL
	var welcomeUrl;
	// Check installation reason
	switch (details.reason) {
		case 'install':
			welcomeUrl = 'https://github.com/PerfectSlayer/scrollupfolder/wiki/FirstRun';
			break;
		case 'update':
			welcomeUrl = 'https://github.com/PerfectSlayer/scrollupfolder/wiki/Changelog';
			break;
	}
	// Open welcome URL in a new tab if defined
	if (welcomeUrl) {
		browser.tabs.create({
			'url': welcomeUrl
		});
	}
});

/*
 * Initialize add-on.
 */
// Load settings
loadSettings();
