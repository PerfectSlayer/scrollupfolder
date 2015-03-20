// Create packaging
if(!fr) var fr = {};
if(!fr.hardcoding) fr.hardcoding = {};
if(!fr.hardcoding.scrollupfolder) fr.hardcoding.scrollupfolder = {};

// Define Scroll Up Folder package
fr.hardcoding.scrollupfolder = {
	/**
	 * Preferences service.
	 */
	prefs: {
		showButton: Application.prefs.get('extensions.scrollupfolder.showButton'),
		controlMode: Application.prefs.get('extensions.scrollupfolder.controlMode'),
		invertScroll: Application.prefs.get('extensions.scrollupfolder.invertScroll'),
		parseGetVars: Application.prefs.get('extensions.scrollupfolder.parseGetVars'),
		badUriAction: Application.prefs.get('extensions.scrollupfolder.badUriAction'),
		version: Application.prefs.get('extensions.scrollupfolder.version')
	},
	
	/**
	 * Tab timer.
	 */
	tabTimer: Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer),

	/**
	 * Add events.
	 * @param	event		Event.
	 */
	onLoad: function(event) {
		// Initialize urlbar event
		fr.hardcoding.scrollupfolder.urlbar.init();
		// Initialize urlbar button event
		fr.hardcoding.scrollupfolder.button.init();
		// Initialize browserProgressListener event
		fr.hardcoding.scrollupfolder.browserProgressListener.init();
		// Initialize tabProgressListener event
		fr.hardcoding.scrollupfolder.tabProgressListener.init();
		// Initialize prefObserver event
		fr.hardcoding.scrollupfolder.prefObserver.init();
		// Check update
		fr.hardcoding.scrollupfolder.checkUpdate();
		// Remove event onLoad
		gBrowser.removeEventListener('load', fr.hardcoding.scrollupfolder.onLoad, true);
	},
	
	/**
	 * Get the add-on version then apply update.
	 * @see https://developer.mozilla.org/en/Code_snippets/Miscellaneous#Retrieving_the_version_of_an_extension_as_specified_in_the_extension's_install.rdf
	 */
	checkUpdate: function() {
		// Import addon manager
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
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
		// Check the version registered in preferences
		if (fr.hardcoding.scrollupfolder.prefs.version.value == "uninstalled") {
			// Save the current version in preferences
			fr.hardcoding.scrollupfolder.prefs.version.value = currentVersion;
			// Create timer callback
			var timerCallbak = {
				notify: function(timer) {
					// Open the first run page
					gBrowser.selectedTab = gBrowser.addTab("https://github.com/PerfectSlayer/scrollupfolder/wiki/FirstRun");
				}
			};
			// Initialize the tab timer
			fr.hardcoding.scrollupfolder.tabTimer.initWithCallback(timerCallbak, 500, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
		} else if (fr.hardcoding.scrollupfolder.prefs.version.value != currentVersion) {
			// Save the current version in preferences
			fr.hardcoding.scrollupfolder.prefs.version.value = currentVersion;
			// Create timer callback
			var timerCallbak = {
				notify: function(timer) {
					// Open the changelog page
					gBrowser.selectedTab = gBrowser.addTab("https://github.com/PerfectSlayer/scrollupfolder/wiki/Changelog");
				}
			};
			// Initialize the tab timer
			fr.hardcoding.scrollupfolder.tabTimer.initWithCallback(timerCallbak, 500, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
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
		 * Initialise urlbar event.
		 */
		init: function() {
			// Get urlbar-container element
			var urlbar_container = document.getElementById('urlbar-container');
			// Get urlbar element
			var urlbar = document.getElementById('urlbar');
			// Add scrolling event on urlbar-container
			urlbar_container.addEventListener('DOMMouseScroll', fr.hardcoding.scrollupfolder.urlbar.onScroll, true);
			// Add clicking event on urlbar
			urlbar.addEventListener('click', fr.hardcoding.scrollupfolder.urlbar.onClick, true);
			// Add key pressing down event on urlbar
			urlbar.addEventListener('keydown', fr.hardcoding.scrollupfolder.urlbar.onKeyDown, true);
			// Add key pressing up event on urlbar
			urlbar.addEventListener('keyup', fr.hardcoding.scrollupfolder.urlbar.onKeyUp, true);
		},
		
		/**
		 * Apply chosen URI.
		 * @param	event		Event.
		 */
		onClick: function(event) {
			// Check the mouse control mode
			if (fr.hardcoding.scrollupfolder.prefs.controlMode.value == 2) {
				return;
			}
			// Getting chosen url
			var url = document.getElementById('urlbar').value;
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
			if (fr.hardcoding.scrollupfolder.prefs.controlMode.value == 2) {
				return;
			}
			var currentTab = getBrowser().selectedBrowser;
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
			var goUp = (event.detail < 0 && !fr.hardcoding.scrollupfolder.prefs.invertScroll.value) ||  
				(event.detail > 0 && fr.hardcoding.scrollupfolder.prefs.invertScroll.value);
			if (goUp && currentTab.SUFPointer < currentTab.SUFPaths.length-1) {
				currentTab.SUFPointer++;
			}
			// Go down in paths list
			else if (!goUp && currentTab.SUFPointer > 0) {
				currentTab.SUFPointer--;
			}
			// Get the new path to display
			var url = currentTab.SUFPaths[currentTab.SUFPointer];
			// Get the urlbar element
			var urlbar = document.getElementById('urlbar');
			// Display chosen path
			urlbar.value = currentTab.SUFPaths[currentTab.SUFPointer];
			// Set the cursor at the end of path
			urlbar.setSelectionRange(url.length, url.length);
		},
		
		/**
		 * Display paths.
		 * @param	event		Event.
		 */
		onKeyDown: function(event) {
			// Get panel element
			var panel = document.getElementById('scrollupfolderUrlsPanel');
			// Select next element in listbox
			if (event.keyCode == event.DOM_VK_UP && panel.state == 'open') {
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
				// Update url in urlbar
				document.getElementById('urlbar').value = item.label;
			} else 
			// Select previous element in listbox
			if (event.keyCode == event.DOM_VK_DOWN && panel.state == 'open') {
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
				// Update url in urlbar
				document.getElementById('urlbar').value = item.label;
			}
		},
		
		/**
		 * Hide paths.
		 * @param	event		Event.
		 */
		onKeyUp: function(event) {
			// Check the keyboard control mode
			if (fr.hardcoding.scrollupfolder.prefs.controlMode.value == 1) {
				return;
			}
			// Get panel element
			var panel = document.getElementById('scrollupfolderUrlsPanel');
			// Open the panel
			if (event.keyCode == event.DOM_VK_ALT && panel.state == 'closed') {
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
				// Display panel
				panel.openPopup(urlbar, 'after_start', 0, 0, false, false);
			} else 
			// Close the panel
			if (event.keyCode == event.DOM_VK_ALT && panel.state == 'open') {
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
					var currentTab = getBrowser().selectedBrowser;
					// Update SUF pointer
					currentTab.SUFPointer = listbox.getIndexOfItem(item);
					// Load URI in current tab
					fr.hardcoding.scrollupfolder.loadURI(item.label, event);
				}
				// Hide panel
				panel.hidePopup();
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
		 * Add paths to listbox.
		 */
		onShowing: function() {
			// Get listbox element
			var listbox = document.getElementById('scrollupfolderUrlsListbox');
			// Get current tab
			var currentTab = getBrowser().selectedBrowser;
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
			// Get the urlpanel element
			var urlpanel = document.getElementById('scrollupfolderUrlsPanel');
			// Get the urlbar element
			var urlbar = document.getElementById('urlbar');
			// Fix urlpanel width
			urlpanel.width = urlbar.scrollWidth;
			return true;
		},
		
		/**
		 * Panel is shown.
		 */
		onShown: function() {
			// Get listbox element
			var listbox = document.getElementById('scrollupfolderUrlsListbox');
			// Get current tab
			var currentTab = getBrowser().selectedBrowser;
			// Select current url
			listbox.selectItem(listbox.getItemAtIndex(currentTab.SUFPointer));
			// Get the urlbar element
			var urlbar = document.getElementById('urlbar');
			// Set the cursor at the end of the url
			var positionCursor = urlbar.value.length;
			urlbar.setSelectionRange(positionCursor, positionCursor);
			// Get the suf-button element
			var suf_button = document.getElementById('fr_hardcoding_scrollupfolder_urlbar_button');
			// Mark the button as open
			suf_button.setAttribute("open", "true");
			return true;
		},
		
		/**
		 * Remove rows from panel.
		 */
		onHidden: function() {
			// Get listbox element
			var listbox = document.getElementById('scrollupfolderUrlsListbox');
			// Remove items
			while(listbox.getRowCount() > 0) {
				listbox.removeItemAt(0);
			}
			// Get the suf-button element
			var suf_button = document.getElementById('fr_hardcoding_scrollupfolder_urlbar_button');
			// Mark the button as closed
			suf_button.setAttribute("open", "false");
			return true;
		},
		
		/**
		 * Display the selected row in urlbar.
		 */
		onClick: function() {
			// Get listbox element
			var listbox = document.getElementById('scrollupfolderUrlsListbox');
			// Get selected item
			var item = listbox.getSelectedItem(0);
			// Check selected item
			if (item == null)
				return;
			// Get current tab
			var currentTab = getBrowser().selectedBrowser;
			// Update SUF pointer
			currentTab.SUFPointer = listbox.getIndexOfItem(item);
			// Get the urlbar
			var urlbar = document.getElementById('urlbar');
			// Check the mouse control mode
			if (fr.hardcoding.scrollupfolder.prefs.controlMode.value == 1) {
				// Load URI in current tab
				fr.hardcoding.scrollupfolder.loadURI(item.label);
			} else {
				// Update urlbar localtion
				urlbar.value = item.label;
				// Set urlbar focus
				urlbar.focus();
				// Set the cursor at the end of the url
				var positionCursor = item.label.length;
				urlbar.setSelectionRange(positionCursor, positionCursor);
			}
		},
		
		/**
		 * Load the selected row in urlbar.
		 */
		onDblClick: function() {
			// Get listbox element
			var listbox = document.getElementById('scrollupfolderUrlsListbox');
			// Get selected item
			var item = listbox.getSelectedItem(0);
			// Check selected item
			if (item == null)
				return;
			// Get current tab
			var currentTab = getBrowser().selectedBrowser;
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
		 * Initialise urlbar button event.
		 */
		init: function() {
			// Get suf-button element
			var suf_button = document.getElementById('fr_hardcoding_scrollupfolder_urlbar_button');
			// Add clicking event on suf_button
			suf_button.addEventListener('click', fr.hardcoding.scrollupfolder.button.onClick, true);
			// Update suf_button display
			this.updateDisplay();
		},
		
		/**
		 * Open the urlpanel and manage focus.
		 * @param	event		Event.
		 */
		onClick: function(event) {
			// Check the event button
			if (event.button != 0)
				return true;
			// Get urlbar element
			var urlbar = document.getElementById('urlbar');
			// Get urlpanel element
			var urlpanel = document.getElementById('scrollupfolderUrlsPanel');
			// Give focus to urlbar
			urlbar.focus();
			// Open popup
			urlpanel.openPopup(urlbar, 'after_start', 0, 0, false, false);
		},
		
		/**
		 * Update button display according user preferences.
		 */
		updateDisplay: function() {
			// Get suf-button element
			var suf_button = document.getElementById('fr_hardcoding_scrollupfolder_urlbar_button');
			// Set the display mode
			suf_button.setAttribute("hidden", !fr.hardcoding.scrollupfolder.prefs.showButton.value);
		}
	},
	
	/**
	 * Browser progress listener.
	 * @see https://developer.mozilla.org/en/Code_snippets/Progress_Listeners
	 * @see https://developer.mozilla.org/en/nsIWebProgressListener
	 */
	browserProgressListener: {
		/**
		 * Initialise browser progress listener event.
		 */
		init: function() {
			// Adding page loading event
			gBrowser.addProgressListener(fr.hardcoding.scrollupfolder.browserProgressListener);
		},
		
		/**
		 * Provide listener.
		 * @param	aIID									The IID of the requested interface.
		 * @return											The resulting interface pointer.
		 * @throws	Components.results.NS_NOINTERFACE		The requested interface is not available.
		 */
		QueryInterface: function(aIID) {
			if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
					aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
					aIID.equals(Components.interfaces.nsISupports))
				return this;
			throw Components.results.NS_NOINTERFACE;
		},
		
		/**
		 * State change event handler (used to close urlpanel when a page is loading).
		 * @param	aWebProgress		The nsIWebProgress instance that fired the notification.
		 * @param	aRequest			The nsIRequest  that has changed state (may be null).
		 * @param	aFlag				Flags indicating the new state.
		 * @param	aStatus				Error status code associated with the state change.
		 */
		onStateChange: function(aWebProgress, aRequest, aFlag, aStatus) {
			// Get the "start" state
			const STATE_START = Components.interfaces.nsIWebProgressListener.STATE_START;
			// Check if the change state is a "start" state
			if (aFlag & STATE_START) {
				// Get panel element
				var panel = document.getElementById('scrollupfolderUrlsPanel');
				// Check if the panel is opened
				if (panel.state == "open") {
					// Close the panel
					panel.hidePopup();
				}
			}
		},
		
		/**
		 * Progress change event handler (empty function).
		 * @param	aWebProgress		The nsIWebProgress instance that fired the notification.
		 * @param	aRequest			The nsIRequest that has new progress.
		 * @param	curSelfProgress		The current progress for aRequest.
		 * @param	maxSelfProgress		The maximum progress for aRequest.
		 * @param	curTotalProgress	The current progress for all requests associated with aWebProgress.
		 * @param	maxTotalProgress	The total progress for all requests associated with aWebProgress.
		 */
		onProgressChange: function(aWebProgress, aRequest, curSelfProgress, maxSelfProgress, curTotalProgress, maxTotalProgress) { },
		
		/**
		 * Location change event handler (used to close urlpanel when changing tabs).
		 * @param	aWebProgress		The nsIWebProgress instance that fired the notification.
		 * @param	aRequest			The associated nsIRequest. This may be null in some cases.
		 * @param	aLocation			The URI of the location that is being loaded.
		 */
		onLocationChange: function(aWebProgress, aRequest, aLocation) {
			// Get panel element
			var panel = document.getElementById('scrollupfolderUrlsPanel');
			// Check if the panel is opened
			if (panel.state == "open") {
				// Close the panel
				panel.hidePopup();
			}
		},
		
		/**
		 * Status change event handler (empty function).
		 * @param	aWebProgress		The nsIWebProgress instance that fired the notification.
		 * @param	aRequest			The nsIRequest that has new status.
		 * @param	aStatus				This value is not an error code.
		 * @param	aMessage			Localized text corresponding to aStatus. 
		 */
		onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) { },
		
		/**
		 * Security change event handler (empty function).
		 * @param	aWebProgress		The nsIWebProgress instance that fired the notification.
		 * @param	aRequest			The nsIRequest that has new security state.
		 * @param	aState				A value composed of the Security State Flags and the Security Strength Flags.
		 */
		onSecurityChange: function(aWebProgress, aRequest, aState) { }
	},
	
	/**
	 * Tab progress listener.
	 * @see https://developer.mozilla.org/En/Listening_to_events_on_all_tabs
	 * @see https://developer.mozilla.org/en/nsIWebProgressListener
	 */
	tabProgressListener: {
		/**
		 * Initialise tab progress listener event.
		 */
		init: function() {
			// Adding tabProgressListener to tabs
			gBrowser.addTabsProgressListener(fr.hardcoding.scrollupfolder.tabProgressListener);
		},
		
		/**
		 * Provide listener.
		 * @param	aIID									The IID of the requested interface.
		 * @return											The resulting interface pointer.
		 * @throws	Components.results.NS_NOINTERFACE		The requested interface is not available.
		 */
		QueryInterface: function(aIID) {
			if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
					aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
					aIID.equals(Components.interfaces.nsISupports))
				return this;
			throw Components.results.NS_NOINTERFACE;
		},
		
		/**
		 * Location change event handler (used to asked path processing).
		 * @param	aBrowser			The browser representing the tab whose location changed.
		 * @param	aWebProgress		The nsIWebProgress instance that fired the notification.
		 * @param	aRequest			The associated nsIRequest. This may be null in some cases.
		 * @param	aLocation			The URI of the location that is being loaded.
		 */
		onLocationChange: function(aBrowser, aWebProgress, aRequest, aLocation) {
			// Process paths for tab which send event 
			fr.hardcoding.scrollupfolder.processPaths(aBrowser);
		},
		
		/**
		 * Progress change event handler (empty function).
		 * @param	aBrowser			The browser representing the tab for which updated progress information is being provided.
		 * @param	aWebProgress		The nsIWebProgress instance that fired the notification.
		 * @param	aRequest			The nsIRequest that has new progress.
		 * @param	curSelfProgress		The current progress for aRequest.
		 * @param	maxSelfProgress		The maximum progress for aRequest.
		 * @param	curTotalProgress	The current progress for all requests associated with aWebProgress.
		 * @param	maxTotalProgress	The total progress for all requests associated with aWebProgress.
		 */
		onProgressChange: function(aWebProgress, aRequest, curSelfProgress, maxSelfProgress, curTotalProgress, maxTotalProgress) { },
		
		/**
		 * Security change event handler (empty function).
		 * @param	aBrowser			The browser that fired the notification.
		 * @param	aWebProgress		The nsIWebProgress instance that fired the notification.
		 * @param	aRequest			The nsIRequest that has new security state.
		 * @param	aState				A value composed of the Security State Flags and the Security Strength Flags.
		 */
		onSecurityChange: function(aBrowser, aWebProgress, aRequest, aState) { },
		
		/**
		 * State change event handler (empty function).
		 * @param	aBrowser			The browser that fired the notification.
		 * @param	aWebProgress		The nsIWebProgress instance that fired the notification.
		 * @param	aRequest			The nsIRequest  that has changed state (may be null).
		 * @param	aFlag				Flags indicating the new state.
		 * @param	aStatus				Error status code associated with the state change.
		 */
		onStateChange: function(aBrowser, aWebProgress, aRequest, aFlag, aStatus) { },

		/**
		 * Status change event handler (empty function).
		 * @param	aBrowser			The browser that fired the notification.
		 * @param	aWebProgress		The nsIWebProgress instance that fired the notification.
		 * @param	aRequest			The nsIRequest that has new status.
		 * @param	aStatus				This value is not an error code.
		 * @param	aMessage			Localized text corresponding to aStatus. 
		 */
		onStatusChange: function(aBrowser, aWebProgress, aRequest, aStatus, aMessage) { }
	},
	
	/**
	 * Preferences observer.
	 * @see https://developer.mozilla.org/en/Code_snippets/Preferences#Using_preference_observers
	 * @see https://developer.mozilla.org/en/nsIObserver
	 */
	prefObserver: {
		/**
		 * Initialise preferences listener event.
		 */
		init: function() {
			// Register preferences observer
			this.register();
		},
		
		/**
		 * Register observer on preferences service.
		 */
		register: function() {
			// Get the preferences service
			var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
			// Observer scrollupfolder and children preferences
			this._branch = prefService.getBranch("extensions.scrollupfolder.");
			try {
				// Queue the interface for observing preferences change
				this._branch.QueryInterface(Components.interfaces.nsIPrefBranch);
				// Add the observer
				this._branch.addObserver("", this, false);
			} catch (e) {
				// Queue the interface before gecko 13 (ie Firefox 13) for observing preferences change
				var deprecatedIPrefBranch = "nsIPrefBranch"+"2";
				this._branch.QueryInterface(Components.interfaces[deprecatedIPrefBranch]);
				// Add the observer
				this._branch.addObserver("", this, false);
			}
		},

		/**
		 * Unregister observer of preferences services.
		 */
		unregister: function() {
			// Check if observer is registered
			if (!this._branch)
				return;
			// Remove the observer
			this._branch.removeObserver("", this);
		},

		/**
		 * Observe preferences change.
		 * @param	aSubject			Notification specific interface pointer.
		 * @param	aTopic				The notification topic or subject.
		 * @param	aData				Notification specific wide string.
		 */
		observe: function(aSubject, aTopic, aData) {
			// Check if if is a preferences change
			if (aTopic != "nsPref:changed")
				return;
			// Process changes according preferences changed
			switch (aData) {
				case "showButton":
					// Set the urlbar button display
					fr.hardcoding.scrollupfolder.button.updateDisplay();
					break;
			}
		}
	},

	/**
	 * Load an URI.
	 * @param	uri			The URI to load.
	 * @param	event		The triggering event.
	 */
	loadURI: function(uri, event) {
		try {
			// Create valid URI from chosen url
			var urlClean = fr.hardcoding.scrollupfolder.returnURL(uri);
			// Load valid URI
			fr.hardcoding.scrollupfolder.loadValidURI(urlClean.spec, event);
		}
		// Catching if it is a badly formed URI
		catch(e) {
			switch (fr.hardcoding.scrollupfolder.prefs.badUriAction.value) {
			case 2:
				// Force to load URI
				fr.hardcoding.scrollupfolder.loadValidURI(uri, event);
			break;
			case 1:
				// Replace with current URI
				document.getElementById('urlbar').value = getBrowser().selectedBrowser.currentURI.spec;
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
			openUILinkIn(uri, "window", false);
		}
		// Check control modifier
		else if (event && event.ctrlKey) {
			// Load URI in a new tab
			getBrowser().addTab(uri);
		}
		// Otherwise, load URI in current tab
		else {
			getBrowser().selectedBrowser.loadURI(uri);
		}
	},
	
	/**
	 * Generate paths for a tab.
	 * @param	brower		The tab to generate paths.
	 */
	processPaths: function(browser) {
		// Get current URI (not from urlbar, but loaded URI from current tab)
		var path = browser.currentURI.spec;
		// Check if paths are already generated
		if (browser.SUFPaths) {
			// Check if they tally with current URI
			var index = browser.SUFPaths.indexOf(path);
			if (index != -1) {
				// Update pointer position
				browser.SUFPointer = index;
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
		browser.SUFPaths = paths;
		// Set pointer position
		browser.SUFPointer = 0;
	},

	/**
	 * Compute upper url from a base url.
	 * @param	baseURL					The base URL for computation.
	 * @return							The upper URL from base URL.
	 */
	canGoUp : function(baseUrl)	{
		/*-- Block could be down in the upper domain computation ? --*/
		// Valid baseUrl making an URI
		var url = null;
		try {
			url = new fr.hardcoding.scrollupfolder.returnURL(baseUrl);
		}
		catch(ex) {
			return null;
		}
		/*-- end of block --*/
		var resolvedUrl = null;
		var indexGetParam = baseUrl.indexOf('?');
		// Try to escape GET variables
		if (indexGetParam != -1 && fr.hardcoding.scrollupfolder.prefs.parseGetVars.value) {
			// TODO Improvement for GET variables
//			alert("escape GET");
			return baseUrl.substring(0, indexGetParam);
		} else
		// Try to go one directory up
		if (baseUrl.charAt(baseUrl.length-1) == '/') {
			resolvedUrl = fr.hardcoding.scrollupfolder.doResolve(baseUrl, '..');
			// Check the URI resolution
			if (baseUrl != resolvedUrl && resolvedUrl.substr(resolvedUrl.length-2, 2) != '..') {
//				alert("directory up:\n"+baseUrl+" "+resolvedUrl);
				return resolvedUrl;
			}
		} else 
		// Try to resolve current place
		{
			resolvedUrl = fr.hardcoding.scrollupfolder.doResolve(baseUrl, '.');
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
	},

	doResolve : function(base, relative) {
		var baseURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(base, null, null);
		var baseURL = baseURI.QueryInterface(Components.interfaces.nsIURL);
		return baseURL.resolve(relative);
	},

	returnURL : function(str) {
		var baseURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(str, null, null);
		return baseURI.QueryInterface(Components.interfaces.nsIURL);
	}
};

// Add onLoad event
window.addEventListener(
	"load",
	function () {
		gBrowser.addEventListener("load", fr.hardcoding.scrollupfolder.onLoad, true);
	},
	false
);