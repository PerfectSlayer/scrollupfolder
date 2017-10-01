function computeUpperFolder(url) {
    // Get URL protocal
    var indexProtocol = url.indexOf('://');
    if (indexProtocol === -1) {
        return;
    }
    var protocol = url.substring(0, indexProtocol+3);
    // Check leading slash
    var hasLeadingSlash = url.substring(url.length-1, url.length) === "/";
    // Compute base URL
    var baseUrl = url.substring(indexProtocol+3, hasLeadingSlash ? url.length-1 : url.length-2);
    var index = baseUrl.lastIndexOf('/');
    if (index === -1) {
        return null;
    }
    // Return computed upper folder
    return protocol+baseUrl.substring(0, index)+(hasLeadingSlash?'/':'');
}

function createUpFolders(tabs) {
    // Check tabs
    if (tabs.length == 0) {
        return;
    }
    // Get tab
    var currentTab = tabs[0];
    // Get current URL
    var url = currentTab.url;
    // Check cached URLs
    if (!currentTab.urls) {
        console.log("Compute urls");
        var urls = new Array();
        while (url) {
            urls.push(url);
            url = computeUpperFolder(url);
        }
        currentTab.urls = urls;
    }
    console.log(currentTab.urls);
    currentTab.urls.forEach(url => createUpForder(url));
}

function createUpForder(url) {
    var urlDivElement = document.createElement('div');
    urlDivElement.textContent = url;
    panelElement.appendChild(urlDivElement);
}

function onError(error) {
	console.error("Unable to get the current tab:" + error);
}

var panelElement = document.querySelector('div#panel');

var querying = browser.tabs.query({
	currentWindow: true,
	active: true
});
querying.then(createUpFolders, onError);
