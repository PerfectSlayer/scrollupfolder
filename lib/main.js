// Include SDK modules
const Self = require('sdk/self');
const SimplePrefs = require('sdk/simple-prefs');
const Tabs = require('sdk/tabs');
const Timers = require('sdk/timers');
const Url = require('sdk/url');
// Include urlbar module
const Urlbar = require('urlbar');
// Include URL button module
const UrlButton = require('urlbutton');
// Include URL panel module
const UrlPanel = require('urlpanel');

// Create packaging
if (!fr) var fr = {};
if (!fr.hardcoding) fr.hardcoding = {};
if (!fr.hardcoding.scrollupfolder) fr.hardcoding.scrollupfolder = {};

// Define Scroll Up Folder package
fr.hardcoding.scrollupfolder = {
	/**
	 * The wizard to display.
	 */
	wizards: [{
		'id': 'timeline',
		'url': 'http://scrollupfolder.hardcoding.fr/timeline/'
	}],

	/**
	 * Initialize add-on.
	 */
	init: function() {
		// Initialize urlbar event
		fr.hardcoding.scrollupfolder.urlbar.init();
		// Initialize URL panel event
		fr.hardcoding.scrollupfolder.urlpanel.init();
		// Initialize urlbar button event
		fr.hardcoding.scrollupfolder.button.init();
		// Check update
		fr.hardcoding.scrollupfolder.checkUpdate();
	},

	/**
	 * Check if add-on was updated.
	 */
	checkUpdate: function() {
		/*
		 * Check installation or update.
		 */
		// Check first install
		if (Self.loadReason === 'install') {
			// Open the first run page
			Tabs.open('https://github.com/PerfectSlayer/scrollupfolder/wiki/FirstRun');
		} else
		// Check upgrade
		if (Self.loadReason === 'upgrade') {
			// Open the changelog page
			Tabs.open('https://github.com/PerfectSlayer/scrollupfolder/wiki/Changelog');
		}
		/*
		 * Check wizard to display.
		 */
		// Get last displayed wizard
		var lastWizard = SimplePrefs.prefs.lastWizard;
		// Delare next wizard to display
		var nextWizard = null;
		var wizard;
		// Check each wizard
		for (var index = fr.hardcoding.scrollupfolder.wizards.length - 1; index >= 0; index--) {
			// Get wizard
			wizard = fr.hardcoding.scrollupfolder.wizards[index];
			// Check last wizard
			if (wizard.id === lastWizard) {
				break;
			}
			// Save next wizard
			nextWizard = wizard;
		}
		// Check if next wizard is defined
		if (nextWizard !== null) {
			// Save last wizard
			SimplePrefs.prefs.lastWizard = nextWizard.id;
			// Display next wizard
			Tabs.open(nextWizard.url);
		}
	},

	/**
	 * Behavior of urlbar and his container.
	 */
	urlbar: {
		/**
		 * Prevent the URL panel to be shown.
		 */
		preventUrlPanelShowing: false,
		/**
		 * Timestamp of last scrolling event proceed.
		 */
		lastEventTimeStamp: 0,

		/**
		 * Initialize urlbar event handlers.
		 */
		init: function() {
			// Add scrolling event handling
			Urlbar.on('DOMMouseScroll', fr.hardcoding.scrollupfolder.urlbar.onScroll);
			// Add clicking event handling
			Urlbar.on('click', fr.hardcoding.scrollupfolder.urlbar.onClick);
			// Add key pressing down event handling
			Urlbar.on('keydown', fr.hardcoding.scrollupfolder.urlbar.onKeyDown);
			// Add key pressing up event handling
			Urlbar.on('keyup', fr.hardcoding.scrollupfolder.urlbar.onKeyUp);
		},

		/**
		 * Apply chosen URI.
		 * @param	event		Event.
		 */
		onClick: function(event) {
			// Check the mouse control mode
			if (SimplePrefs.prefs.controlMode === 2) {
				return;
			}
			// Getting chosen URL
			var url = Urlbar.getUrl(Tabs.activeTab.window);
			// Check event (only middle-click) and URL
			if (event.button != 1 || url == null || url.length <= 0) {
				return;
			}
			// Stop event propagation (for X server/linux)
			event.stopPropagation();
			// Add default HTTP protocol if missing
			var indexScheme = url.indexOf('://');
			var indexQuery = url.indexOf('?');
			if ((indexScheme === -1 && url.substr(0, 6) !== 'about:') || (indexQuery !== -1 && indexQuery < indexScheme)) {
				url = 'http://' + url;
			}
			// Load URL
			fr.hardcoding.scrollupfolder.loadUrl(url, event);
		},

		/**
		 * Browse paths.
		 * @param	event		Event.
		 */
		onScroll: function(event) {
			// Check the mouse control mode
			if (SimplePrefs.prefs.controlMode === 2) {
				return;
			}
			// Check if event was already proceed
			if (event.timeStamp == fr.hardcoding.scrollupfolder.urlbar.lastEventTimeStamp) {
				return;
			} else {
				// Save event timestamp
				fr.hardcoding.scrollupfolder.urlbar.lastEventTimeStamp = event.timeStamp;
			}
			// Stop event propagation (for other addon compatibility as Xclear)
			event.stopPropagation();
			// Get current tab
			var currentTab = Tabs.activeTab;
			// Check if paths should be updated
			if (typeof(currentTab.SUFPaths) === 'undefined' || currentTab.SUFPaths.indexOf(currentTab.url) === -1) {
				// Compute paths
				fr.hardcoding.scrollupfolder.processPaths(currentTab);
			}
			// Go up in paths list
			var goUp = (event.detail < 0 && !SimplePrefs.prefs.invertScroll) || (event.detail > 0 && SimplePrefs.prefs.invertScroll);
			if (goUp && currentTab.SUFPointer < currentTab.SUFPaths.length - 1) {
				currentTab.SUFPointer++;
			}
			// Go down in paths list
			else if (!goUp && currentTab.SUFPointer > 0) {
				currentTab.SUFPointer--;
			}
			// Get the new path to display
			var url = currentTab.SUFPaths[currentTab.SUFPointer];
			// Display the path to the urlbar URL
			Urlbar.setUrl(currentTab.window, url);
		},

		/**
		 * Display paths.
		 * @param	event		Event.
		 */
		onKeyDown: function(event) {
			// Get active window
			var window = Tabs.activeTab.window;
			// Check if URL panel is opened
			if (!UrlPanel.isOpened(window)) {
				return;
			}
			// Select next element in listbox
			if (event.keyCode == event.DOM_VK_UP) {
				// Select upper item in URL panel
				var url = UrlPanel.selectUpperItem(window);
				// Update URL in urlbar
				Urlbar.setUrl(window, url);
			} else
			// Select previous element in listbox
			if (event.keyCode == event.DOM_VK_DOWN) {
				// Select down item in URL panel
				var url = UrlPanel.selectDownItem(window);
				// Update URL in urlbar
				Urlbar.setUrl(window, url);
			}
		},

		/**
		 * Hide paths.
		 * @param	event		Event.
		 */
		onKeyUp: function(event) {
			// Check the keyboard control mode
			if (SimplePrefs.prefs.controlMode === 1) {
				return;
			}
			// Get active window
			var window = Tabs.activeTab.window;
			// Check if URL panel is opened
			var urlPanelOpened = UrlPanel.isOpened(window);
			// Open the panel
			if (event.keyCode == event.DOM_VK_ALT && !urlPanelOpened) {
				// Prevent panel opening if key up event were for another key binding
				if (this.preventUrlPanelShowing) {
					// Ask to stop to prevent URL panel showing
					this.preventUrlPanelShowing = false;
					return;
				}
				// Stop event propagation
				event.stopPropagation();
				// Cancel event to prevent menu to be displayed
				event.preventDefault();
				// Display URL panel
				UrlPanel.open(window);
			} else
			// Close the panel
			if (event.keyCode == event.DOM_VK_ALT && urlPanelOpened) {
				// Stop event propagation
				event.stopPropagation();
				// Cancel event to prevent menu to be displayed
				event.preventDefault();
				// Get current tab
				var currentTab = Tabs.activeTab;
				// Get selected item
				var url = UrlPanel.getSelectedItem(window);
				// Get selected item index
				var index = UrlPanel.getSelectedIndex(window);
				if (url && index >= 0 && index < currentTab.SUFPaths.length) {
					// Update SUF pointer
					currentTab.SUFPointer = index;
					// Load URL
					fr.hardcoding.scrollupfolder.loadUrl(url, event);
				}
				// Close URL panel
				UrlPanel.close(window);
			} else
			// Record a keybinding (starting with alt key but not for SUF)
			if (event.altKey) {
				// Ask to prevent URL panel showing
				this.preventUrlPanelShowing = true;
			}
		}
	},

	/**
	 * Behavior of URL panel.
	 */
	urlpanel: {
		/**
		 * Initialize URL panel event handlers.
		 */
		init: function() {
			// Add popup showing event handling
			UrlPanel.on('popupshowing', fr.hardcoding.scrollupfolder.urlpanel.onShowing);
			// Add popup shown event handling
			UrlPanel.on('popupshown', fr.hardcoding.scrollupfolder.urlpanel.onShown);
			// Add popup hidden event handling
			UrlPanel.on('popuphidden', fr.hardcoding.scrollupfolder.urlpanel.onHidden);
			// Add popup click event handling
			UrlPanel.on('click', fr.hardcoding.scrollupfolder.urlpanel.onClick);
			// Add popup hidden event handling
			UrlPanel.on('dblclick', fr.hardcoding.scrollupfolder.urlpanel.onDblClick);
			// Ensure the URL panel is closed when active tab changed
			Tabs.on('activate', fr.hardcoding.scrollupfolder.urlpanel.ensureClose);
			// Declare ensure panel closed method
			var ensurePanelClosed = function(tab) {
				// Close the panel
				UrlPanel.close(tab.window);
			};
			// Declare attach handler method
			var attachHandlers = function(tab) {
				// Ensure the URL panel is closed when tab is ready or page shown
				tab.on('ready', fr.hardcoding.scrollupfolder.urlpanel.ensureClose);
				tab.on('pageshow', fr.hardcoding.scrollupfolder.urlpanel.ensureClose);
			};
			// Attach handlers for all current tabs
			for (let tab of Tabs) {
				attachHandlers(tab);
			}
			// Add event handler on new tab to attach handlers
			Tabs.on('open', attachHandlers);
		},

		/**
		 * Ensure the URL panel is closed.
		 * @param	tab			The tab that request the panel to be closed.
		 */
		ensureClose: function(tab) {
			// Close the panel
			UrlPanel.close(tab.window);
		},

		/**
		 * Add paths to listbox.
		 * @param	event		The event.
		 */
		onShowing: function(event) {
			// Get listbox element
			var listbox = event.listbox;
			// Get current tab
			var currentTab = Tabs.activeTab;
			// Declare current pointer
			var pointer;
			// Check if paths should be updated
			if (typeof(currentTab.SUFPaths) === 'undefined' || (pointer = currentTab.SUFPaths.indexOf(currentTab.url)) === -1) {
				// Compute paths
				fr.hardcoding.scrollupfolder.processPaths(currentTab);
			} else {
				// Update pointer
				currentTab.SUFPointer = pointer;
			}
			// Prevent panel showing if these is no path
			if (currentTab.SUFPaths.length === 0) {
				// Cancel event to prevent popup to be displayed
				event.preventDefault();
				return;
			}
			// Set URL panel items
			UrlPanel.setItems(currentTab.window, currentTab.SUFPaths);
		},

		/**
		 * Panel is shown.
		 * @param	event		The event.
		 */
		onShown: function(event) {
			// Get current tab
			var currentTab = Tabs.activeTab;
			// Select current URL
			UrlPanel.setSelectedIndex(currentTab.window, currentTab.SUFPointer);
			// Start input in urlbar
			Urlbar.startInput(currentTab.window);
			// Mark URL button as opened
			UrlButton.markOpened(currentTab.window);
		},

		/**
		 * Remove rows from panel.
		 * @param	event		The event.
		 */
		onHidden: function(event) {
			// Get current window
			var window = Tabs.activeTab.window;
			// Mark URL button as closed
			UrlButton.markClosed(window);
		},

		/**
		 * Display the selected row in urlbar.
		 * @param	event		The event.
		 */
		onClick: function(event) {
			// Get current tab
			var currentTab = Tabs.activeTab;
			// Get selected item
			var selectedItem = UrlPanel.getSelectedItem(currentTab.window);
			// Check selected item
			if (selectedItem == null) {
				return;
			}
			// Check the mouse control mode
			if (SimplePrefs.prefs.controlMode === 1) {
				// Get selected item index
				var selectedIndex = UrlPanel.getSelectedIndex(currentTab.window);
				// Check selected index
				if (selectedIndex !== -1) {
					return;
				}
				// Update SUF pointer
				currentTab.SUFPointer = selectedIndex;
				// Load URL
				fr.hardcoding.scrollupfolder.loadUrl(selectedItem, event);
			} else {
				// Update urlbar location
				Urlbar.setUrl(currentTab.window, selectedItem, true);
			}
		},

		/**
		 * Load the selected row in urlbar.
		 * @param	event		The event.
		 */
		onDblClick: function(event) {
			// Get current tab
			var currentTab = Tabs.activeTab;
			// Get selected item
			var selectedItem = UrlPanel.getSelectedItem(currentTab.window);
			// Get selected index
			var selectedIndex = UrlPanel.getSelectedIndex(currentTab.window);
			// Check selected item and index
			if (selectedItem == null || selectedIndex === -1) {
				return;
			}
			// Update SUF pointer
			currentTab.SUFPointer = selectedIndex;
			// Load URL
			fr.hardcoding.scrollupfolder.loadUrl(selectedItem, event);
		}
	},

	/**
	 * Behavior of urlbar button.
	 */
	button: {
		/**
		 * Initialize urlbar button event hander.
		 */
		init: function() {
			// Add clicking event handling
			UrlButton.on('click', fr.hardcoding.scrollupfolder.button.onClick);
		},

		/**
		 * Open the URL panel and manage focus.
		 * @param	event		Event.
		 */
		onClick: function(event) {
			// Check the event button
			if (event.button != 0)
				return;
			// Open URL panel
			UrlPanel.open(Tabs.activeTab.window);
		}
	},

	/**
	 * Load an URL.
	 * @param	url			The URL to load.
	 * @param	event		The triggering event.
	 */
	loadUrl: function(url, event) {
		try {
			// Create valid URL from given URL
			var cleanedUrl = Url.URL(url);
			// Load valid URL
			fr.hardcoding.scrollupfolder.loadValidUrl(cleanedUrl.toString(), event);
		}
		// Catching if it is a badly formed URL
		catch (exception) {
			switch (SimplePrefs.prefs.badUriAction) {
				case 2:
					// Force to load URL
					fr.hardcoding.scrollupfolder.loadValidUrl(url, event);
					break;
				case 1:
					// Get current tab
					var currentTab = Tabs.activeTab;
					// Replace with current URL
					Urlbar.setUrl(currentTab.window, currentTab.url);
					break;
					// Otherwise, do noting
			}
		}
	},

	/**
	 * Load a valid URL.
	 * @param	url			The URL to load.
	 * @param	event		The triggering event.
	 */
	loadValidUrl: function(url, event) {
		// Check shift modifier
		if (event && event.shiftKey) {
			// Load URL in a new browser
			Tabs.open({
				url: url,
				inNewWindow: true
			});
		}
		// Check control modifier
		else if (event && event.ctrlKey) {
			// Load URL in a new tab
			Tabs.open(url);
		}
		// Otherwise, load URL in current tab
		else {
			Tabs.activeTab.url = url;
		}
	},

	/**
	 * Generate paths for a tab.
	 * @param	tab		The tab to generate paths.
	 */
	processPaths: function(tab) {
		// Get current URL (not from urlbar, but loaded URL from current tab)
		var path = tab.url;
		// Check if paths are already generated
		if (tab.SUFPaths) {
			// Check if they tally with current URL
			var index = tab.SUFPaths.indexOf(path);
			if (index != -1) {
				// Update pointer position
				tab.SUFPointer = index;
				// End path computation
				return;
			}
		}
		// Initialize paths
		var paths = new Array();
		// Prevent path computation on about page
		if (path.substr(0, 6) !== 'about:') {
			// Create paths
			while (path != null) {
				paths.push(path);
				path = fr.hardcoding.scrollupfolder.computeUpperUrl(path);
			}
		}
		// Set path to current tab
		tab.SUFPaths = paths;
		// Set pointer position
		tab.SUFPointer = 0;
	},

	/**
	 * Compute upper URL from a base URL.
	 * @param	baseUrl					The base URL for computation.
	 * @return							The upper URL from base URL, null if there no upper URL.
	 */
	computeUpperUrl: function(baseUrl) {
		// Valid baseUrl making an URL
		var url = null;
		try {
			url = Url.URL(baseUrl);
		} catch (exception) {
			return null;
		}
		// Try to escape anchor
		if (SimplePrefs.prefs.parseAnchor) {
			// Get anchor index
			var indexAnchor = baseUrl.lastIndexOf('#');
			if (indexAnchor !== -1) {
				// Return URL without anchor
				return baseUrl.substring(0, indexAnchor);
			}
		}
		// Try to escape GET variables
		if (SimplePrefs.prefs.parseGetVars) {
			// Get GET parameters index
			var indexGetParams = baseUrl.indexOf('?');
			if (indexGetParams !== -1) {
				// Get GET parameters separator index
				var indexGetSeparator = baseUrl.lastIndexOf('&');
				if (indexGetSeparator !== -1 && indexGetSeparator > indexGetParams) {
					// Return URL without last GET parameter
					return baseUrl.substring(0, indexGetSeparator);
				}
				// Return URL without GET parameters
				return baseUrl.substring(0, indexGetParams);
			}
		}
		// Try to go one directory up
		if (baseUrl.charAt(baseUrl.length - 1) === '/') {
			// Get one directory up URL
			var resolvedUrl = Url.URL('..', baseUrl).toString();
			// Check the URL resolution
			if (baseUrl != resolvedUrl && resolvedUrl.substr(resolvedUrl.length - 2, 2) != '..' && resolvedUrl.substr(resolvedUrl.length - 3, 3) != '../') {
				// Return one directory up URL
				return resolvedUrl;
			}
		}
		// Try to resolve current place
		else {
			var resolvedUrl = Url.URL('.', baseUrl).toString();
			if (resolvedUrl !== baseUrl) {
				return resolvedUrl;
			}
		}
		// Get domain URI
		var domain = url.host;
		// Check if domain is IPv4 URL
		if (domain.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
			return null;
		}
		// Compute upper domain
		var upperDomain = domain.replace(/.*?\./, '');
		// Get dot matches
		var dotMatches = upperDomain.match(/\./g);
		// Check computed upper domain
		if (upperDomain == domain || dotMatches === null) {
			return null;
		}
		// Get URL scheme
		var scheme = url.scheme;
		// Declare resolved URL
		var resolvedUrl = null;
		// Check top level domain name
		if (dotMatches.length <= 1) {
			// Add default www subdomain to TLD name
			resolvedUrl = scheme + '://www.' + upperDomain + '/';
		} else {
			// Resolve URL from upper domain
			resolvedUrl = scheme + '://' + upperDomain + '/';
		}
		// Check resolved URL
		if (resolvedUrl == baseUrl) {
			return null;
		}
		// Return resolved URL
		return resolvedUrl;
	}
};

// Initialize add-on
fr.hardcoding.scrollupfolder.init();

// Export test API
exports.computeUpperUrl = fr.hardcoding.scrollupfolder.computeUpperUrl;
