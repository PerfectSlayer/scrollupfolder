/**
 * The click event listener of panel item.
 * @param url The clicked panel item URL.
 */
function onPanelItemClicked(url) {
	// Close the panel
	window.close();
	// Send message to load URL
	browser.runtime.sendMessage({
		"message": "set-url",
		"url": url
	});
}

/**
 * Create a panel element.
 * @param url The element URL.
 * @param selected The element selected status (true if selected, false otherwise).
 */
function createPanelElement(url, selected) {
	// Create element
	var element = document.createElement('div');
	// Set content
	element.textContent = url;
	// Append selected style
	if (selected) {
		element.classList.add('selected');
	}
	// Bind element behavior
	element.onclick = () => onPanelItemClicked(url);
	// Append element to panel
	panelElement.appendChild(element);
}

function handleUrlResponse(message) {
	console.log("Reponse");
	console.log(message);
	message.urls.forEach((url, index) => createPanelElement(url, message.selected === index));
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
