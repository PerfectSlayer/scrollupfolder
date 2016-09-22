// Include SDK modules
const Self = require('sdk/self');
const SimplePrefs = require('sdk/simple-prefs');
const Tabs = require('sdk/tabs');
const Timers = require('sdk/timers');
const Url = require('sdk/url');
// Include urlbar module
const Urlbar = require('lib/urlbar');
// Include URL button module
const UrlButton = require('lib/urlbutton');
// Include URL panel module
const UrlPanel = require('lib/urlpanel');

// Define Scroll Up Folder package
let fr = {};
fr.hardcoding = {};
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
		// Listen preferences
		fr.hardcoding.scrollupfolder.listenPrefs();
		console.log('Loading done');
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
			// Do not open any other popup
			return;
		}
		// Check upgrade
		else if (Self.loadReason === 'upgrade') {
			// Open the changelog page
			Tabs.open('https://github.com/PerfectSlayer/scrollupfolder/wiki/Changelog');
			// Do not open any other popup
			return;
		}
		/*
		 * Check wizard to display.
		 */
		// Get last displayed wizard
		let lastWizard = SimplePrefs.prefs.lastWizard;
		// Delare next wizard to display
		let nextWizard = null;
		let wizard;
		// Check each wizard
		for (let index = fr.hardcoding.scrollupfolder.wizards.length - 1; index >= 0; index--) {
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
			let url = Urlbar.getUrl(Tabs.activeTab);
			// Check event (only middle-click) and URL
			if (event.button != 1 || url == null || url.length <= 0) {
				return;
			}
			// Stop event propagation (for X server/linux)
			event.stopPropagation();
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
			let currentTab = Tabs.activeTab;
			// Compute paths
			fr.hardcoding.scrollupfolder.processPaths(currentTab);
			// Go up in paths list
			let goUp = (event.detail < 0 && !SimplePrefs.prefs.invertScroll) || (event.detail > 0 && SimplePrefs.prefs.invertScroll);
			if (goUp && currentTab.SUFPointer < currentTab.SUFPaths.length - 1) {
				// Update curent pointer
				currentTab.SUFPointer++;
			}
			// Go down in paths list
			else if (!goUp && currentTab.SUFPointer > 0) {
				// Update curent pointer
				currentTab.SUFPointer--;
			}
			// Get the new path to display
			let url = currentTab.SUFPaths[currentTab.SUFPointer];
			// Get active window
			let window = currentTab.window;
			// Display the path to the urlbar URL
			Urlbar.setUrl(currentTab, url);
			// Check if panel is opened
			if (UrlPanel.isOpened(window)) {
				// Update selected index
				UrlPanel.setSelectedIndex(window, currentTab.SUFPointer);
			}
		},

		/**
		 * Display paths.
		 * @param	event		Event.
		 */
		onKeyDown: function(event) {
			// Get active window
			let window = Tabs.activeTab.window;
			// Check if URL panel is opened
			if (!UrlPanel.isOpened(window)) {
				return;
			}
			// Declare url
			let url = null;
			// Select next element in listbox
			if (event.keyCode == event.DOM_VK_UP) {
				// Select upper item in URL panel
				url = UrlPanel.selectUpperItem(window);
			}
			// Select previous element in listbox
			else if (event.keyCode == event.DOM_VK_DOWN) {
				// Select down item in URL panel
				url = UrlPanel.selectDownItem(window);
			}
			// Check if URL is defined
			if (url !== null) {
				// Get selected index
				let selectedIndex = UrlPanel.getSelectedIndex(window);
				if (selectedIndex !== -1) {
					// Update current pointer
					Tabs.activeTab.SUFPointer = selectedIndex;
				}
				// Update URL in urlbar
				Urlbar.setUrl(Tabs.activeTab, url);
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
			let window = Tabs.activeTab.window;
			// Check if URL panel is opened
			let urlPanelOpened = UrlPanel.isOpened(window);
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
				let currentTab = Tabs.activeTab;
				// Get selected item
				let url = UrlPanel.getSelectedItem(window);
				// Get selected item index
				let index = UrlPanel.getSelectedIndex(window);
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
			let ensurePanelClosed = function(tab) {
				// Close the panel
				UrlPanel.close(tab.window);
			};
			// Declare attach handler method
			let attachHandlers = function(tab) {
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
			let listbox = event.listbox;
			// Get current tab
			let currentTab = Tabs.activeTab;
			// Compute paths
			fr.hardcoding.scrollupfolder.processPaths(currentTab);
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
			let currentTab = Tabs.activeTab;
			// Select current URL
			UrlPanel.setSelectedIndex(currentTab.window, currentTab.SUFPointer);
			// Start input in urlbar
			Urlbar.startInput(currentTab);
			// Mark URL button as opened
			UrlButton.markOpened(currentTab.window);
		},

		/**
		 * Remove rows from panel.
		 * @param	event		The event.
		 */
		onHidden: function(event) {
			// Get current window
			let window = Tabs.activeTab.window;
			// Mark URL button as closed
			UrlButton.markClosed(window);
		},

		/**
		 * Display the selected row in urlbar.
		 * @param	event		The event.
		 */
		onClick: function(event) {
			// Get current tab
			let currentTab = Tabs.activeTab;
			// Get selected item index
			let selectedIndex = UrlPanel.getSelectedIndex(currentTab.window);
			// Check selected index
			if (selectedIndex === -1) {
				return;
			}
			// Get selected item
			let selectedItem = UrlPanel.getSelectedItem(currentTab.window);
			// Check selected item
			if (selectedItem == null) {
				return;
			}
			// Update SUF pointer
			currentTab.SUFPointer = selectedIndex;
			// Check the mouse control mode
			if (SimplePrefs.prefs.controlMode === 1) {
				// Load URL
				fr.hardcoding.scrollupfolder.loadUrl(selectedItem, event);
			} else {
				// Update urlbar location
				Urlbar.setUrl(currentTab, selectedItem);
				// Start input in urlbar
				Urlbar.startInput(currentTab);
			}
		},

		/**
		 * Load the selected row in urlbar.
		 * @param	event		The event.
		 */
		onDblClick: function(event) {
			// Get current tab
			let currentTab = Tabs.activeTab;
			// Get selected item
			let selectedItem = UrlPanel.getSelectedItem(currentTab.window);
			// Get selected index
			let selectedIndex = UrlPanel.getSelectedIndex(currentTab.window);
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
			let cleanedUrl = Url.URL(url);
			// Load valid URL
			fr.hardcoding.scrollupfolder.loadValidUrl(cleanedUrl.toString(), event);
		}
		// Catching if it is a badly formed URL
		catch (exception) {
			console.log('Failed to load cleaned URL');
			switch (SimplePrefs.prefs.badUriAction) {
				case 2:
					// Force to load URL
					fr.hardcoding.scrollupfolder.loadValidUrl(url, event);
					break;
				case 1:
					// Get current tab
					let currentTab = Tabs.activeTab;
					// Replace with current URL
					Urlbar.setUrl(currentTab, currentTab.url);
					break;
				default:
					// Otherwise, do noting
					break;
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
		console.log('Process paths');
		// Get current URL (not from urlbar, but loaded URL from current tab)
		let currentUrl = tab.url;
		// Declare current URL index
		let currentIndex;
		// Check if paths was not already generated or if they are not matching the current URL
		if (typeof(tab.SUFPaths) === 'undefined' || (currentIndex = tab.SUFPaths.indexOf(currentUrl)) === -1) {
			// Set path to current tab
			tab.SUFPaths = fr.hardcoding.scrollupfolder.computePaths(currentUrl);
			// Set initial pointer position
			tab.SUFPointer = 0;
			// Stop path processing
			return;
		}
		// Define pointer set status
		let pointerSet = false;
		// Get URL in urlbar
		let urlbarUrl = Urlbar.getUrl(tab);
		// Check urlbar URL
		if (urlbarUrl !== null) {
			// Check if urlbar URL maches one of path
			let urlbarIndex = tab.SUFPaths.indexOf(urlbarUrl);
			if (urlbarIndex !== -1) {
				// Set pointer to urlbar URL index
				tab.SUFPointer = urlbarIndex;
				// Mark pointer as set
				pointerSet = true;
			} else {
				// Compute paths for urlbar URL
				let urlbarPaths = fr.hardcoding.scrollupfolder.computePaths(urlbarUrl);
				// Check each computed paths from urlbar URL
				for (let urlbarPathsIndex = 1, urlbarPathsCount = urlbarPaths.length; urlbarPathsIndex<urlbarPathsCount; urlbarPathsIndex++) {
					// Check if urlbar URL path matches one of computed paths
					urlbarIndex = tab.SUFPaths.indexOf(urlbarPaths[urlbarPathsIndex]);
					if (urlbarIndex !== -1) {
						// Set pointer to urlbar URL index
						tab.SUFPointer = urlbarIndex;
						// Mark pointer as set
						pointerSet = true;
						break;
					}
				}
			}
		}
		// Check if pointer was set
		if (!pointerSet) {
			// Set pointer to current URL index
			tab.SUFPointer = currentIndex;
			console.log("Default pointer setting")
		}
		console.log("Set index to : " + tab.SUFPointer);
	},

	/**
	 * Compute paths from an URL.
	 * @param	path	The base URL to compute paths.
	 * @return			An array of the computed paths.
	 */
	computePaths: function(path) {
		// Initialize paths
		let paths = new Array();
		// Prevent path computation on about page
		if (path.substr(0, 6) !== 'about:') {
			// Create paths
			while (path != null) {
				paths.push(path);
				path = fr.hardcoding.scrollupfolder.computeUpperUrl(path);
			}
		}
		// Return computed paths
		return paths;
	},

	/**
	 * Compute upper URL from a base URL.
	 * @param	baseUrl					The base URL for computation.
	 * @return							The upper URL from base URL, null if there no upper URL.
	 */
	computeUpperUrl: function(baseUrl) {
		// Valid baseUrl making an URL
		let url = null;
		try {
			url = Url.URL(baseUrl);
		} catch (exception) {
			return null;
		}
		// Try to escape anchor
		if (SimplePrefs.prefs.parseAnchor) {
			// Get anchor index
			let indexAnchor = baseUrl.lastIndexOf('#');
			if (indexAnchor !== -1) {
				// Return URL without anchor
				return baseUrl.substring(0, indexAnchor);
			}
		}
		// Try to escape GET variables
		if (SimplePrefs.prefs.parseGetVars) {
			// Get GET parameters index
			let indexGetParams = baseUrl.indexOf('?');
			if (indexGetParams !== -1) {
				// Get GET parameters separator index
				let indexGetSeparator = baseUrl.lastIndexOf('&');
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
			let resolvedUrl = Url.URL('..', baseUrl).toString();
			// Check the URL resolution
			if (baseUrl != resolvedUrl && resolvedUrl.substr(resolvedUrl.length - 2, 2) != '..' && resolvedUrl.substr(resolvedUrl.length - 3, 3) != '../') {
				// Return one directory up URL
				return resolvedUrl;
			}
		}
		// Try to resolve current place
		else {
			let resolvedUrl = Url.URL('.', baseUrl).toString();
			if (resolvedUrl !== baseUrl) {
				return resolvedUrl;
			}
		}
		// Get domain URI
		let domain = url.host;
		// Check if domain is IPv4 URL
		if (domain.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
			return null;
		}
		// Compute upper domain
		let upperDomain = domain.replace(/.*?\./, '');
		// Get dot matches
		let dotMatches = upperDomain.match(/\./g);
		// Check computed upper domain
		if (upperDomain == domain || dotMatches === null) {
			return null;
		}
		// Get URL scheme
		let scheme = url.scheme;
		// Declare resolved URL
		let resolvedUrl = null;
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
	},

	/**
	 * Listen preferences changes.
	 */
	listenPrefs: function() {
		// Listen path computation related preferences
		SimplePrefs.on('parseAnchor', fr.hardcoding.scrollupfolder.onPrefChange);
		SimplePrefs.on('parseGetVars', fr.hardcoding.scrollupfolder.onPrefChange);
	},

	/**
	 * Apply the preference change.
	 * @param	preferenceName			The name of the changing preference.
	 */
	onPrefChange: function(preferenceName) {
		// For each tabs
		for (let tab of Tabs) {
			// Clear paths
			delete tab.SUFPaths;
			// Clear current pointer
			delete tab.SUFPointer;
		}
	}
};

// Initialize add-on
fr.hardcoding.scrollupfolder.init();

// Export test API
exports.computeUpperUrl = fr.hardcoding.scrollupfolder.computeUpperUrl;
