/*
 * Declare URL management.
 */
// Declare URLs cache (indexed by tab id)
var urlCache = {};

function computeUpperFolder(url) {
	// Get URL protocal
	var indexProtocol = url.indexOf('://');
	if (indexProtocol === -1) {
		return;
	}
	var protocol = url.substring(0, indexProtocol + 3);
	// Check leading slash
	var hasLeadingSlash = url.substring(url.length - 1, url.length) === "/";
	// Compute base URL
	var baseUrl = url.substring(indexProtocol + 3, hasLeadingSlash ? url.length - 1 : url.length - 2);
	var index = baseUrl.lastIndexOf('/');
	if (index === -1) {
		return null;
	}
	// Return computed upper folder
	return protocol + baseUrl.substring(0, index+1);
}

function computeFolders(url) {
	console.log("Compute urls: "+url);
	var urls = new Array();
	while (url) {
		urls.push(url);
		url = computeUpperFolder(url);
	}
	return urls;
}

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
	console.log("Load URL: "+url);
	browser.tabs.update(tab.id, {"url": url});
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
// Bind tab update listener
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	console.log("Tab update " + tabId);
	console.log(changeInfo);
	console.log(tab);
	// Check tab URL
	if (tab.url && tab.url.substr(0, 6) !== 'about:') {
		browser.pageAction.show(tabId);
	} else {
		browser.pageAction.hide(tabId);
	}
});

/*
 * Declare commands behavior.
 */
browser.commands.onCommand.addListener(command => {
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
			computeUrlFunction = tab => tab.urls[Math.min(tab.selected + 1, tab.urls.length-1)];
			break;
		case "browse-to-bottom":
			console.log("Browse to bottom command");
			computeUrlFunction = tab => tab.urls[ tab.urls.length-1];
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
		browser.tabs.create({'url': welcomeUrl});
	}
});
