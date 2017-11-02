// Retrieve settings elements
const urlbarIconCheckbox = document.querySelector("#urlbar-icon-checkbox");
const shortcutsCheckbox = document.querySelector("#shortcuts-checkbox");
const parseAnchorCheckbox = document.querySelector("#parse-anchor-checkbox");
const parseGetVariablesCheckbox = document.querySelector("#parse-get-variables-checbox");

/**
 * Attach event listener to settings elements.
 */
function attachListeners() {
	urlbarIconCheckbox.addEventListener("change", saveOptions);
	shortcutsCheckbox.addEventListener("change", saveOptions);
	parseAnchorCheckbox.addEventListener("change", saveOptions);
	parseGetVariablesCheckbox.addEventListener("change", saveOptions);
}

/**
 * Bind current settings values to settings elements.
 */
function bindSettings(settings) {
	urlbarIconCheckbox.checked = settings.urlbarIcon;
	shortcutsCheckbox.checked = settings.shortcuts;
	parseAnchorCheckbox.checked = settings.parseAnchor;
	parseGetVariablesCheckbox.checked = settings.parseGetVariables;
}

/**
 * Save the current settings elements values.
 */
function saveOptions() {
	browser.storage.local.set({ // TODO: USE SYNC STORAGE
		"settings": {
			urlbarIcon: urlbarIconCheckbox.checked,
			shortcuts: shortcutsCheckbox.checked,
			parseAnchor: parseAnchorCheckbox.checked,
			parseGetVariables: parseGetVariablesCheckbox.checked
		}
	}).then(null, error => {
		console.error("Unable to save settings: " + error);
	})
}

/**
 * Load settings current values.
 */
function loadOptions() {
	// Get the user settings (defining default options otherwise)
	browser.storage.local.get({ // TODO: USE SYNC STORAGE
		"settings": {
			urlbarIcon: true,
			shortcuts: true,
			parseAnchor: true,
			parseGetVariables: true
		}
	}).then(result => {
		bindSettings(result.settings);
		attachListeners();
	}, error => {
		console.error("Unable to load settings: " + error);
	});
}

// Bind content loaded event to start loading options
document.addEventListener("DOMContentLoaded", loadOptions);
