// Include modules
const SimplePrefs = require('sdk/simple-prefs');
const Tabs = require('sdk/tabs');
const Timers = require('sdk/timers');
const Url = require('sdk/url');
// Include chrome module for Component Utils
const {Cu} = require('chrome');
// Include urlbar module
const Urlbar = require('urlbar');
// Include urlbutton module
const Urlbutton = require('urlbutton');
// Include urlpanel module
const Urlpanel = require('urlpanel');

// Create packaging
if(!fr) var fr = {};
if(!fr.hardcoding) fr.hardcoding = {};
if(!fr.hardcoding.scrollupfolder) fr.hardcoding.scrollupfolder = {};

// Define Scroll Up Folder package
fr.hardcoding.scrollupfolder = {
	/**
	 * Add events.
	 * @param	event		Event.
	 */
	onLoad: function(event) {
		// Initialize urlbar event
		fr.hardcoding.scrollupfolder.urlbar.init();
		// Initialize url panel event
		fr.hardcoding.scrollupfolder.urlpanel.init();
		// Initialize urlbar button event
		fr.hardcoding.scrollupfolder.button.init();
		// Check update
		fr.hardcoding.scrollupfolder.checkUpdate();
		sendLog('chargement fini');
	},
	
	/**
	 * Get the add-on version then apply update.
	 * @see https://developer.mozilla.org/en/Code_snippets/Miscellaneous#Retrieving_the_version_of_an_extension_as_specified_in_the_extension's_install.rdf
	 */
	checkUpdate: function() {
		sendLog("checkUpdate");
		// Import addon manager
		Cu.import("resource://gre/modules/AddonManager.jsm");
		// Look for addon
		AddonManager.getAddonByID("scrollupfolder@omni.n0ne.org", function(addon) {
			// Apply check update with addon version
			fr.hardcoding.scrollupfolder.applyUpdate(addon.version);
		});
	},
	
	/**
	 * Check the update or the first run of the extension.
	 */
	applyUpdate: function(currentVersion) {
		sendLog("applyUpdate");
		sendLog("lastRunVersion: "+SimplePrefs.prefs.version);
		sendLog("currentVersion: "+currentVersion);
		// Check the version registered in preferences
		if (SimplePrefs.prefs.version == "uninstalled") {
			// Save the current version in preferences
			SimplePrefs.prefs.version = currentVersion;
			// Start timer to open page
			Timers.setTimeout(function() {
				// Open the first run page
				Tabs.open("https://github.com/PerfectSlayer/scrollupfolder/wiki/FirstRun");
			}, 500);
		} else if (SimplePrefs.prefs.version != currentVersion) {
			// Save the current version in preferences
			SimplePrefs.prefs.version = currentVersion;
			// Start timer to open page
			Timers.setTimeout(function() {
				// Open the changelog page
				Tabs.open("https://github.com/PerfectSlayer/scrollupfolder/wiki/Changelog");
			}, 500);
		}
	},
	
	/**
	 * Behavior of urlbar and his container.
	 */
	urlbar: {
		/**
		 * Prevent the urlpanel to be shown.
		 */
		preventUrlPanelShowing: false,
		/**
		 * Timestamp of last scrolling event proceed.
		 */
		lastEventTimeStamp: 0,
		
		/**
		 * Initialize urlbar event.
		 */
		init: function() {
			// Add scrolling event handling on urlbar-container
			Urlbar.on('scroll', fr.hardcoding.scrollupfolder.urlbar.onScroll);
			// Add clicking event handling on urlbar
			Urlbar.on('click', fr.hardcoding.scrollupfolder.urlbar.onClick);
			// Add key pressing down event handling on urlbar
			Urlbar.on('keyDown', fr.hardcoding.scrollupfolder.urlbar.onKeyDown);
			// Add key pressing up event handling on urlbar
			Urlbar.on('keyUp', fr.hardcoding.scrollupfolder.urlbar.onKeyUp);
		},
		
		/**
		 * Apply chosen URI.
		 * @param	event		Event.
		 */
		onClick: function(event) {
			// Check the mouse control mode
			if (SimplePrefs.prefs.controlMode == 2) {
				return;
			}
			// Getting chosen url
			var url = Urlbar.getUrl(Tabs.activeTab.window);
			// Check event (only middle-clic) and url
			if (event.button != 1 || url == null || url.length <= 0) {
				return;
			}
			// Stop event propagation (for X server/linux)
			event.stopPropagation();
			// Add default http protocol if missing
			var indexScheme = url.indexOf('://');
			var indexQuery = url.indexOf('?');
			if ((indexScheme == -1 && url.substr(0, 6) != 'about:') || (indexQuery !=- 1 && indexQuery < indexScheme)) {
				url = "http://"+url;
			}
			// Load url in current tab
			fr.hardcoding.scrollupfolder.loadURI(url, event);
		},

		/**
		 * Browse paths.
		 * @param	event		Event.
		 */
		onScroll: function(event) {
			// Check the mouse control mode
			if (SimplePrefs.prefs.controlMode == 2) {
				return;
			}
			// Get current tab
			var currentTab = Tabs.activeTab;
			// Check if paths were generated
			if (!currentTab.SUFPaths) {
				fr.hardcoding.scrollupfolder.processPaths(currentTab);
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
			// Go up in paths list
			var goUp = (event.detail < 0 && !SimplePrefs.prefs.invertScroll) || (event.detail > 0 && SimplePrefs.prefs.invertScroll);
			if (goUp && currentTab.SUFPointer < currentTab.SUFPaths.length-1) {
				currentTab.SUFPointer++;
			}
			// Go down in paths list
			else if (!goUp && currentTab.SUFPointer > 0) {
				currentTab.SUFPointer--;
			}
			// Get the new path to display
			var url = currentTab.SUFPaths[currentTab.SUFPointer];
			// Display the path to the urlbar url
			Urlbar.setUrl(currentTab.window, url);
		},
		
		/**
		 * Display paths.
		 * @param	event		Event.
		 */
		onKeyDown: function(event) {
			// Get active window
			var window = Tabs.activeTab.window;
			// Check if urlpanel is opened
			var urlPanelOpened = Urlpanel.isOpened(window);
			// Select next element in listbox
			if (event.keyCode == event.DOM_VK_UP && urlPanelOpened) {
				// Stop event propagation
				event.stopPropagation();
				// Cancel event to prevent the awesome bar to be displayed
				event.preventDefault();
				// Get listbox element
				var listbox = document.getElementById('scrollupfolderUrlsListbox');
				// Get the selected item
				var selectedListItem = listbox.getSelectedItem(0);
				// Check if it is the first row
				var selectedListItemIdex = listbox.getIndexOfItem(selectedListItem);
				if (selectedListItemIdex == 0)
					return;
				// Select the next item
				var item = listbox.getItemAtIndex(selectedListItemIdex-1);
				listbox.selectItem(item);
				// Update url in urlbar						// TODO Should be optional
				Urlbar.setUrl(window, item.label);
				sendLog({'index': selectedListItemIdex, 'action': 'up'});
			} else 
			// Select previous element in listbox
			if (event.keyCode == event.DOM_VK_DOWN && urlPanelOpened) {
				// Stop event propagation
				event.stopPropagation();
				// Cancel event to prevent the awesome bar to be displayed
				event.preventDefault();
				// Get listbox item
				var listbox = document.getElementById('scrollupfolderUrlsListbox');
				// Get the selected item
				var selectedListItem = listbox.getSelectedItem(0);
				// Check if it is the last row
				var selectedListItemIdex = listbox.getIndexOfItem(selectedListItem);
				if (selectedListItemIdex == listbox.getRowCount()-1)
					return;
				// Select the next item
				var item = listbox.getItemAtIndex(selectedListItemIdex+1);
				listbox.selectItem(item);
				// Update url in urlbar					// TODO Should be optional
				Urlbar.setUrl(window, item.label);
				sendLog({'index': selectedListItemIdex, 'action': 'down'});
			}
		},
		
		/**
		 * Hide paths.
		 * @param	event		Event.
		 */
		onKeyUp: function(event) {
			// Check the keyboard control mode
			if (SimplePrefs.prefs.controlMode == 1) {
				return;
			}
			// Get active window
			var window = Tabs.activeTab.window;
			// Check if urlpanel is opened
			var urlPanelOpened = Urlpanel.isOpened(window);
			// Open the panel
			if (event.keyCode == event.DOM_VK_ALT && !urlPanelOpened) {
				// Prevent panel opening if key up event were for another key binding
				if (this.preventUrlPanelShowing) {
					// Ask to stop to prevent url panel showing
					this.preventUrlPanelShowing = false;
					return;
				}
				// Stop event propagation
				event.stopPropagation();
				// Cancel event to prevent menu to be displayed
				event.preventDefault();
				// Get urlbar element
				var urlbar = document.getElementById('urlbar');
				// Check if awesomebar popup is opened
				if (urlbar.popup.state == "open") {
					// Close the awesomebar popup
					urlbar.popup.hidePopup();
				}
				// Display url panel
				Urlpanel.open(window);
			} else 
			// Close the panel
			if (event.keyCode == event.DOM_VK_ALT && urlPanelOpened) {
				// Stop event propagation
				event.stopPropagation();
				// Cancel event to prevent menu to be displayed
				event.preventDefault();
				// Get listbox element
				var listbox = document.getElementById('scrollupfolderUrlsListbox');
				// Get selected item
				var item = listbox.getSelectedItem(0);
				if (item != null) {
					// Get current tab
					var currentTab = Tabs.activeTab;
					// Update SUF pointer
					currentTab.SUFPointer = listbox.getIndexOfItem(item);
					// Load URI in current tab
					fr.hardcoding.scrollupfolder.loadURI(item.label, event);
				}
				// Close urlpanel
				Urlpanel.close(window);
			} else
			// Record a keybinding (starting with alt key but not for SUF)
			if (event.altKey) {
				// Ask to prevent url panel showing
				this.preventUrlPanelShowing = true;
			}
		}
	},
	
	/**
	 * Behavior of url panel.
	 */
	urlpanel: {
		/**
		 * Initialize url panel event.
		 */
		init: function() {
			// Add popup showing event handling
			Urlpanel.on('popupshowing', fr.hardcoding.scrollupfolder.urlpanel.onShowing);
			// Add popup shown event handling
			Urlpanel.on('popupshown', fr.hardcoding.scrollupfolder.urlpanel.onShown);
			// Add popup hidden event handling
			Urlpanel.on('popuphidden', fr.hardcoding.scrollupfolder.urlpanel.onHidden);
			// Add popup click event handling
			Urlpanel.on('click', fr.hardcoding.scrollupfolder.urlpanel.onClick);
			// Add popup hidden event handling
			Urlpanel.on('dblclick', fr.hardcoding.scrollupfolder.urlpanel.onDblClick);
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
			// Check if paths were generated
			if (typeof(currentTab.SUFPaths) == 'undefined') {
				fr.hardcoding.scrollupfolder.processPaths(currentTab);
			}
			// Prevent panel showing if these is no path
			if (currentTab.SUFPaths.length == 0) {
				return false;
			}
			// Create listitem
			var index, listitem;
			for (index in currentTab.SUFPaths)
				listitem = listbox.appendItem(currentTab.SUFPaths[index]);
			// Fix listbox size
			var rows = listbox.getRowCount();
			if (rows != 0)
				listbox.setAttribute('rows', rows);
			return true;
		},
		
		/**
		 * Panel is shown.
		 * @param	event		The event.
		 */
		onShown: function(event) {
			// Get listbox element
			var listbox = event.listbox;
			// Get current tab
			var currentTab = Tabs.activeTab;
			// Select current url
			listbox.selectItem(listbox.getItemAtIndex(currentTab.SUFPointer));
			// Start input in urlbar
			Urlbar.startInput(currentTab.window);
			// Mark urlbutton as opened
			Urlbutton.markOpened(currentTab.window);
			return true;
		},
		
		/**
		 * Remove rows from panel.
		 * @param	event		The event.
		 */
		onHidden: function(event) {
			// Get listbox element
			var listbox = event.listbox;
			// Remove items
			while(listbox.getRowCount() > 0) {
				listbox.removeItemAt(0);
			}
			// Mark urlbutton as closed
			Urlbutton.markClosed(Tabs.activeTab.window);
			return true;
		},
		
		/**
		 * Display the selected row in urlbar.
		 * @param	event		The event.
		 */
		onClick: function(event) {
			// Get listbox element
			var listbox = event.listbox;
			// Get selected item
			var item = listbox.getSelectedItem(0);
			// Check selected item
			if (item == null)
				return;
			// Get current tab
			var currentTab = Tabs.activeTab;
			// Update SUF pointer
			currentTab.SUFPointer = listbox.getIndexOfItem(item);
			// Check the mouse control mode
			if (SimplePrefs.prefs.controlMode == 1) {
				// Load URI in current tab
				fr.hardcoding.scrollupfolder.loadURI(item.label);
			} else {
				// Update urlbar localtion
				Urlbar.setUrl(currentTab.window, item.label, true);
			}
		},
		
		/**
		 * Load the selected row in urlbar.
		 * @param	event		The event.
		 */
		onDblClick: function(event) {
			// Get listbox element
			var listbox = event.listbox;
			// Get selected item
			var item = listbox.getSelectedItem(0);
			// Check selected item
			if (item == null)
				return;
			// Get current tab
			var currentTab = Tabs.activeTabs;
			// Update SUF pointer
			currentTab.SUFPointer = listbox.getIndexOfItem(item);
			// Load URI in current tab
			fr.hardcoding.scrollupfolder.loadURI(item.label);
		}
	
	
	// panel xul reference	https://developer.mozilla.org/en/XUL/panel
	// panel menu guide		https://developer.mozilla.org/en/XUL/PopupGuide/Panels
	// key codes			https://developer.mozilla.org/en/DOM/Event/UIEvent/KeyEvent
	// DOM & xul			https://developer.mozilla.org/en/Dynamically_modifying_XUL-based_user_interface
	
	// Code review : populate list on popupshowing event : https://developer.mozilla.org/en/XUL/panel#a-onpopupshowing
	// 				go to url on popuphiddin
	//				clear listbox on popuphidden event
	},
	
	/**
	 * Behavior of urlbar button.
	 */
	button: {
		/**
		 * Initialize urlbar button event.
		 */
		init: function() {
			// Add clicking event on suf_button
			Urlbutton.on('click', fr.hardcoding.scrollupfolder.button.onClick);
		},
		
		/**
		 * Open the urlpanel and manage focus.
		 * @param	event		Event.
		 */
		onClick: function(event) {
			// Check the event button
			if (event.button != 0)
				return true;
			// Open url panel
			Urlpanel.open(Tabs.activeTab.window);
		}
	},
	
	/**
	 * Load an URI.
	 * @param	uri			The URI to load.
	 * @param	event		The triggering event.
	 */
	loadURI: function(uri, event) {
		try {
			// Create valid URI from chosen URL
			var urlClean = Url.URL(uri);
			// Load valid URI
			fr.hardcoding.scrollupfolder.loadValidURI(urlClean.spec, event);
		}
		// Catching if it is a badly formed URI
		catch(e) {
			sendLog('failed to load clean URI');
			switch (SimplePrefs.prefs.badUriAction) {
			case 2:
				// Force to load URI
				fr.hardcoding.scrollupfolder.loadValidURI(uri, event);
			break;
			case 1:
				// Replace with current URI
				document.getElementById('urlbar').value = Tabs.activeTab.url;
			break;
			// Otherwise, do noting
			}
		}
	},

	/**
	 * Load a valid URI.
	 * @param	uri			The URI to load.
	 * @param	event		The triggering event.
	 */
	loadValidURI: function(uri, event) {
		// Check shift modifier
		if (event && event.shiftKey) {
			// Load URI in a new browser
			Tabs.open({
				url: uri,
				inNewWindow: true
			});
		}
		// Check control modifier
		else if (event && event.ctrlKey) {
			// Load URI in a new tab
			Tabs.open(uri);
		}
		// Otherwise, load URI in current tab
		else {
			Tabs.activeTab.url = uri;
		}
	},
	
	/**
	 * Generate paths for a tab.
	 * @param	tab		The tab to generate paths.
	 */
	processPaths: function(tab) {
		sendLog("focus");
		// Get current URI (not from urlbar, but loaded URI from current tab)
		var path = tab.url;
		// Check if paths are already generated
		if (tab.SUFPaths) {
			// Check if they tally with current URI
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
		if (path.substr(0, 6) != 'about:') {
			// Create paths
			while(path != null)	{
				paths.push(path);
				path = fr.hardcoding.scrollupfolder.canGoUp(path);
			}
		}
		// Set path to current tab
		tab.SUFPaths = paths;
		// Set pointer position
		tab.SUFPointer = 0;
	},

	/**
	 * Compute upper url from a base url.
	 * @param	baseURL					The base URL for computation.
	 * @return							The upper URL from base URL.
	 */
	canGoUp : function(baseUrl) {
		/*-- Block could be down in the upper domain computation ? --*/
		// Valid baseUrl making an URI
		var url = null;
		try {
			url = Url.URL(baseUrl);
		}
		catch(ex) {
			return null;
		}
		/*-- end of block --*/
		var resolvedUrl = null;
		var indexAnchor = baseUrl.indexOf('#');
		// Try to espace anchor
		if (indexAnchor != -1 && SimplePrefs.prefs.parseAnchor) {
			return baseUrl.substring(0, indexAnchor);
		}
		var indexGetParam = baseUrl.indexOf('?');
		// Try to escape GET variables
		if (indexGetParam != -1 && SimplePrefs.prefs.parseGetVars) {
			// TODO Improvement for GET variables
//			alert("escape GET");
			return baseUrl.substring(0, indexGetParam);
		} else
		// Try to go one directory up
		if (baseUrl.charAt(baseUrl.length-1) == '/') {
			resolvedUrl = Url.URL('..', baseUrl).toString();
			// Check the URI resolution
			if (baseUrl != resolvedUrl && resolvedUrl.substr(resolvedUrl.length-2, 2) != '..') {
//				alert("directory up:\n"+baseUrl+" "+resolvedUrl);
				return resolvedUrl;
			}
		} else 
		// Try to resolve current place
		{
			resolvedUrl = Url.URL('.', baseUrl).toString();
			if (resolvedUrl != baseUrl) {
//				alert("resolveUrl:\n"+baseUrl+" "+resolvedUrl);
				return resolvedUrl;
			}
		}
//		alert("Resolved: "+resolvedUrl+"\nBase: "+baseUrl);
//		if (resolvedUrl != baseUrl && resolvedUrl.substr(resolvedUrl.length-2, 2) != '..') {
//			returnUrl = resolvedUrl;
//		} else 
		// Try to go one domain up
		// Get domain URI
		var domain = url.host;
		// TODO Really usefull ?
//			if (domain == null) {
//				return null;
//			}
		// Check if domain is IPv4 url
		if (domain.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
			return null;
		}
		// Get schema URI
		var scheme = url.scheme;
		/* lets see if can go up domain */
		/* delete first . of domain */
		var newDomain = domain.replace(/.*?\./,'');
		// var currentURI = getBrowser().selectedBrowser.currentURI;
		// sendLog({'old': content.document.domain, 'new': currentURI.host});
		// Check upper domain calculated
		if (newDomain == null || newDomain == domain || newDomain.indexOf('.') == -1) {
			return null;
		}
		/* if one period add www */
		var matches = newDomain.match(/\./g);
		if(matches != null && matches.length <= 1) {
			resolvedUrl = scheme+'://www.'+newDomain+'/';
		} else {
			resolvedUrl = scheme+'://'+newDomain+'/';
		}
		if (resolvedUrl == baseUrl) {
			return null;
		}
		return resolvedUrl;
	}
};

//Send debug message to console (debug only)
function sendLog(msg) {
	if (msg == null) { 
		msg = "[null value]";
	} else if (typeof msg == 'object') {
		var newMsg = '';
		for(item in msg) {
			newMsg+= "'"+item+"' => '"+msg[item]+"', \n";
		}
		msg = newMsg.substring(0, newMsg.length-3);
	}
	console.log(msg);
};

// Load extension
fr.hardcoding.scrollupfolder.onLoad();