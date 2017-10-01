function onError(error) {
	console.error("An error occured:" + error);
}

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
	return protocol + baseUrl.substring(0, index) + (hasLeadingSlash ? '/' : '');
}

function getCurrentUrls(callback) {
	var querying = browser.tabs.query({
		currentWindow: true,
		active: true
	});
	querying.then(tabs => createUpFolders(tabs, callback), onError);

}

function createUpFolders(tabs, callback) {
	// Check tabs
	if (tabs.length == 0) {
		return;
	}
	// Get tab
	var currentTab = tabs[0];
	// Get current URL
	var url = currentTab.url;
	console.log("Compute urls");
	var urls = new Array();
	while (url) {
		urls.push(url);
		url = computeUpperFolder(url);
	}
	callback({
		"return": "get-current-urls",
		"tabId": currentTab.id,
		"urls": urls,
		"selected": 0
	});
}

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
		case 'get-current-urls':
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
