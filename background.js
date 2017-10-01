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

function computeFolders(url) {
	console.log("Compute urls");
	var urls = new Array();
	while (url) {
		urls.push(url);
		url = computeUpperFolder(url);
	}
	return urls;
}

function getCurrentUrls(callback) {
	var querying = browser.tabs.query({
		currentWindow: true,
		active: true
	});
	querying.then(tabs => getUrls(tabs[0], callback), onError);
}

/**
 * Get URLs of a tab.
 * @param tab The tab to compute URLs.
 * @param callback The callback to send result.
 */
function getUrls(tab, callback) {
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
 * @return Always true to keep callback alive for async response.
 */
function handleMessage(request, sender, sendResponse) {
	console.log("Message received");
	console.log(request);
	switch (request.message) {
		case 'get-urls':
			getCurrentUrls(sendResponse);
			break;
	}
	return true;
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
