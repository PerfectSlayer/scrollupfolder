// Retrieve settings elements
const displayUrlbarIconCheckbox = document.querySelector("#display-urlbar-icon-checkbox");
const enableShortcutsCheckbox = document.querySelector("#enable-shortcuts-checkbox");
const parseAnchorCheckbox = document.querySelector("#parse-anchor-checkbox");
const parseDomainCheckbox = document.querySelector("#parse-domain-checkbox");
const parseGetVariablesCheckbox = document.querySelector("#parse-get-variables-checbox");

/**
 * Attach event listener to settings elements.
 */
function attachListeners() {
	displayUrlbarIconCheckbox.addEventListener("change", saveOptions);
	enableShortcutsCheckbox.addEventListener("change", saveOptions);
	parseAnchorCheckbox.addEventListener("change", saveOptions);
	parseDomainCheckbox.addEventListener("change", saveOptions);
	parseGetVariablesCheckbox.addEventListener("change", saveOptions);
}

/**
 * Bind current settings values to settings elements.
 */
function bindSettings(settings) {
	console.log(settings);
	displayUrlbarIconCheckbox.checked = !(settings.displayUrlbarIcon === false);
	enableShortcutsCheckbox.checked = !(settings.enableShortcuts === false);
	parseAnchorCheckbox.checked = !(settings.parseAnchor === false);
	parseDomainCheckbox.checked = !(settings.parseDomain === false);
	parseGetVariablesCheckbox.checked = !(settings.parseGetVariables === false);
}

/**
 * Save the current settings elements values.
 */
function saveOptions() {
	browser.storage.sync.set({
		"settings": {
			displayUrlbarIcon: displayUrlbarIconCheckbox.checked,
			enableShortcuts: enableShortcutsCheckbox.checked,
			parseAnchor: parseAnchorCheckbox.checked,
			parseDomain: parseDomainCheckbox.checked,
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
	browser.storage.sync.get({
		"settings": {
			displayUrlbarIcon: true,
			enableShortcuts: true,
			parseAnchor: true,
			parseDomain: true,
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
