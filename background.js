function onError(error) {
	console.error("An error occured:" + error);
}

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

/**
 * Load an URL into a tab.
 * @param tab The tab to load URL into.
 * @param url The URL to load.
 */
function loadUrl(tab, url) {
	console.log("Load URL: "+url);
	browser.tabs.update(tab.id, {"url": url});
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

function findCurrentTab(onCurrentTabFound) {
	var querying = browser.tabs.query({
		currentWindow: true,
		active: true
	});
	querying.then(tabs => onCurrentTabFound(tabs[0]), onError);
}

/**
 * Get URLs of a tab.
 * @param tab The tab to compute URLs.
 * @param callback The callback to send result.
 */
function getUrls(tab, callback) {
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
		//cachedUrls =
		selected = 0;
	}
	// Notify callback
	callback({
		"return": "get-urls",
		"tabId": tabId,
		"urls": urlCache[tabId],
		"selected": selected
	});
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
			findCurrentTab(tab => getUrls(tab, sendResponse));
			return true;
		case 'set-url':
			findCurrentTab(tab => loadUrl(tab, request.url));
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
