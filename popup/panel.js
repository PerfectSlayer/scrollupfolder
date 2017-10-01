function createUpForder(url, selected) {
	var urlDivElement = document.createElement('div');
	urlDivElement.textContent = url;
	if (selected) {
		urlDivElement.style.fontWeight = "bold";
	}
	panelElement.appendChild(urlDivElement);
}

function handleUrlResponse(message) {
	console.log(message);
	message.urls.forEach((url, index) => createUpForder(url, message.selected === index));
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
	message: "get-urls"
});
sending.then(handleUrlResponse, handleUrlError);
