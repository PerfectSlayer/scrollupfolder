function createUpForder(url) {
	var urlDivElement = document.createElement('div');
	urlDivElement.textContent = url;
	panelElement.appendChild(urlDivElement);
}

function handleUrlResponse(message) {
    console.log(message);
    message.urls.forEach(url => createUpForder(url));
    // TODO message.selected
}

function handleUrlError(error) {
	console.error("Error while getting urls: " + error);
	// Ensure the popup is closed
	window.close();
}

// Get the panel element
var panelElement = document.querySelector('div#panel');
// Send message to get URLs
var sending = browser.runtime.sendMessage({
	message: "get-current-urls"
});
sending.then(handleUrlResponse, handleUrlError);
