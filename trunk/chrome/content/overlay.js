// Create packaging
if(!fr) var fr = {};
if(!fr.hardcoding) fr.hardcoding = {};
if(!fr.hardcoding.scrollupfolder) fr.hardcoding.scrollupfolder = {};

// Define Scroll Up Folder package
fr.hardcoding.scrollupfolder = {
	/**
	 * Preferences service.
	 */
	prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),

	/**
	 * Add events.
	 * @param	event		Event
	 */
	onLoad: function(event) {
		// Remove event onLoad
		gBrowser.removeEventListener('load', fr.hardcoding.scrollupfolder.onLoad, true);
		// Initialize urlbar event
		fr.hardcoding.scrollupfolder.urlbar.onLoad();
		// Initialize urlpanel event
		fr.hardcoding.scrollupfolder.urlpanel.onLoad();
				// Add key pressing down event on scrollupfolderUrlsPanel
				// listbox.addEventListener('keydown', fr.hardcoding.scrollupfolder.urlbar.onKeyDown, true);
				// Add key pressing up event on scrollupfolderUrlsPanel
				// listbox.addEventListener('keyup', fr.hardcoding.scrollupfolder.urlbar.onKeyUp, true);
		sendLog('chargement fini');
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
		 * Initialise urlbar event.
		 */
		onLoad: function() {
			// Get urlbar-container element
			var urlbar_container = document.getElementById('urlbar-container');
			// Get urlbar element
			var urlbar = document.getElementById('urlbar');
			// Add focusing envent on urlbar-container
			urlbar_container.addEventListener('mouseover', fr.hardcoding.scrollupfolder.urlbar.onFocus, true);
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
		 * Generate paths for a tab.
		 * @param	event		Event
		 */
		onFocus: function(event) {
			// Get current tab
			var currentTab = getBrowser().selectedBrowser;
			// Get current URI (not from urlbar, but loaded URI from current tab)
			var path = currentTab.currentURI.spec;
			// Check if path are already generated and if they tally with current URI or if doesn't been generated because it's an about: URI
			if ((currentTab.SUFPaths && currentTab.SUFPaths.indexOf(path) == -1) || (!currentTab.SUFPaths && path.substr(0, 6) != 'about:')) {
				// Initialize paths
				var paths = new Array();
				// Create paths
				while(path != null)	{
					paths.push(path);
					path = fr.hardcoding.scrollupfolder.canGoUp(path);
				}
				// Set path to current tab
				currentTab.SUFPaths = paths;
				// Set pointer position
				currentTab.SUFPointer = 0;
			} 
		},
		
		/**
		 * Apply chosen URI.
		 * @param	event		Event
		 */
		onClick: function(event) {
			// Getting chosen url
			var url = document.getElementById('urlbar').value;
			// Check event (only middle-clic) and url
			if (event.button != 1 || url == null || url.length <= 0) {
				return;
			}
			try {
				// Create valid URI from chosen url
				var urlClean = fr.hardcoding.scrollupfolder.returnURL(url);
				// Load URI in current tab
				getBrowser().selectedBrowser.loadURI(urlClean.spec);
			}
			// Catching if it is a badly formed URI
			catch(e) {
				sendLog('failed new URI');
				var prefBadUriAction = prefs.getIntPref('extensions.scrollupfolder.badUriAction');
				switch (prefBadUriAction) {
				case 2:
					// Force to load URI
					getBrowser().selectedBrowser.loadURI(url);
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
		 * Browse paths.
		 * @param	event		Event
		 */
		onScroll: function(event) {
			var currentTab = getBrowser().selectedBrowser;
			// Check if paths were generated
			if (!currentTab.SUFPaths) {
				return;
			}
			// Go up in paths list
			if(event.detail < 0 && currentTab.SUFPointer < currentTab.SUFPaths.length-1)
				currentTab.SUFPointer++;
			// Go down in paths list
			else if (event.detail > 0 && currentTab.SUFPointer > 0)
				currentTab.SUFPointer--;
			// Display chosen path and select it
			document.getElementById('urlbar').value = currentTab.SUFPaths[currentTab.SUFPointer];
			document.getElementById('urlbar').select();
		},
		
		/**
		 * Display paths.
		 * @param	event		Event
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
				var item = listbox.getItemAtIndex(selectedListItemIdex-1)
				listbox.selectItem(item);
				// Update url in urlbar						// TODO Should be optionnal
				document.getElementById('urlbar').value = item.label;
				sendLog({'index': selectedListItemIdex, 'action': 'up'});
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
				// Update url in urlbar					// TODO Should be optionnal
				document.getElementById('urlbar').value = item.label;
				sendLog({'index': selectedListItemIdex, 'action': 'down'});
			}
		},
		
		/**
		 * Hide paths.
		 * @param	event		Event
		 */
		onKeyUp: function(event) {
			// Get panel element
			var panel = document.getElementById('scrollupfolderUrlsPanel');
			// Get current tab
			var currentTab = getBrowser().selectedBrowser;
			// Open the panel
			if (event.keyCode == event.DOM_VK_ALT && panel.state == 'closed') {						// event.ctrlKey
				// Prevent panel opening if key up event were for another key binding
				if (preventUrlPanelShowing) {
					// Ask to stop to prevent url panel showing
					preventUrlPanelShowing = false;
					return;
				}
				// Stop event propagation
				event.stopPropagation();
				// Get urlbar element
				var urlbar = document.getElementById('urlbar');
				// Display panel
				panel.openPopup(urlbar, 'after_start', 0, 0, false, false);
			} else 
			// Close the panel
			if (event.keyCode == event.DOM_VK_ALT && panel.state == 'open') {
				// Stop event propagation
				event.stopPropagation();
				// Get listbox element
				var listbox = document.getElementById('scrollupfolderUrlsListbox');
				// Hide panel
				panel.hidePopup();
			} else
			// Go up
			if (event.altKey && event.keyCode == event.DOM_VK_UP) {
				// Check if it's already on top
				if (currentTab.SUFPointer == 0)
					return;
				sendLog("monte");
				sendLog("position "+currentTab.SUFPointer);
				sendLog("current post"+currentTab.SUFPaths[currentTab.SUFPointer]);
				// Stop event propagation
				event.stopPropagation();
				// Cancel event to prevent the awesome bar to be displayed
				event.preventDefault();
				// Update pointer
				currentTab.SUFPointer--;
				// Go to url
				currentTab.loadURI(currentTab.SUFPaths[currentTab.SUFPointer]);
				sendLog("nouveau");
				sendLog("position "+currentTab.SUFPointer);
				sendLog("current post"+currentTab.SUFPaths[currentTab.SUFPointer]);
			} else
			// Go down
			if (event.altKey && event.keyCode == event.DOM_VK_DOWN) {
				// Check if it's already on bottom
				if (currentTab.SUFPointer == currentTab.SUFPaths.length-1)
					return;
				sendLog("descend");
				sendLog("position "+currentTab.SUFPointer);
				sendLog("current post"+currentTab.SUFPaths[currentTab.SUFPointer]);
				// Stop event propagation
				event.stopPropagation();
				// Cancel event to prevent the awesome bar to be displayed
				event.preventDefault();
				// Update pointer
				currentTab.SUFPointer++;
				// Go to url
				currentTab.loadURI(currentTab.SUFPaths[currentTab.SUFPointer]);
				sendLog("new");
				sendLog("position "+currentTab.SUFPointer);
				sendLog("current post"+currentTab.SUFPaths[currentTab.SUFPointer]);
			} else
			// Record a keybinding (starting with alt key but not for SUF)
			if (event.altKey) {
				// Ask to prevent url panel showing
				preventUrlPanelShowing = true;
			}
		}
	},
	
	/**
	 * Behavior of url panel.
	 */
	urlpanel: {
		/**
		 * Initialize event.
		 */
		onLoad: function() {
			// Get panel element
			var panel = document.getElementById('scrollupfolderUrlsPanel');
			// Setting panel behavior
			panel.setAttribute('onpopupshowing', 'fr.hardcoding.scrollupfolder.urlpanel.onShowing();');
			panel.setAttribute('onpopupshown', 'fr.hardcoding.scrollupfolder.urlpanel.onShown();');
			panel.setAttribute('onpopuphidden', 'fr.hardcoding.scrollupfolder.urlpanel.onHidden();');
		},
		
		/**
		 * Add paths to listbox.
		 */
		onShowing: function() {
			// Get listbox element
			var listbox = document.getElementById('scrollupfolderUrlsListbox');
			// Get current tab
			var currentTab = getBrowser().selectedBrowser;
			// Create listitems
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
		 */
		onShown: function() {
			// Get listbox element
			var listbox = document.getElementById('scrollupfolderUrlsListbox');
			// Fix listbox size
			var listbox_rows = listbox.getRowCount();
			if (listbox_rows != 0) {
				sendLog('taille définie: '+listbox_rows);
				listbox.setAttribute('rows', listbox_rows);
			} else
				sendLog('taille 0..');
			sendLog({'getRowCount': listbox.getRowCount(), 'childNodes:': listbox.childNodes.length, 'rows': listbox.getAttribute('rows')});
			// Get current tab
			var currentTab = getBrowser().selectedBrowser;
			// Select current url
			listbox.selectItem(listbox.getItemAtIndex(currentTab.SUFPointer));
			return true;
		},
		
		/**
		 * Remove rows from panel.
		 */
		onHidden: function() {
			// Get listbox element
			var listbox = document.getElementById('scrollupfolderUrlsListbox');
			// Get selected item			// TODO Should be optional
			var item = listbox.getSelectedItem(0);
			if (item != null) {
				// Get current tab
				var currentTab = getBrowser().selectedBrowser;
				// Update SUF pointer
				currentTab.SUFPointer = listbox.getIndexOfItem(item);
				// Load URI in current tab
				currentTab.loadURI(item.label);
			}
			// Remove items
			while(listbox.getRowCount() > 0) {
				listbox.removeItemAt(0);
			}
		}
	
	
	// panel xul reference	https://developer.mozilla.org/en/XUL/panel
	// panel menu guide		https://developer.mozilla.org/en/XUL/PopupGuide/Panels
	// key codes			https://developer.mozilla.org/en/DOM/Event/UIEvent/KeyEvent
	// DOM & xul			https://developer.mozilla.org/en/Dynamically_modifying_XUL-based_user_interface
	
	// Code review : populate list on popupshowing event : https://developer.mozilla.org/en/XUL/panel#a-onpopupshowing
	// 				go to url on popuphiddin
	//				clear listbox on popuphidden event
	},
	

	canGoUp : function(baseUrl)	{
		var returnUrl;
		if(baseUrl == null || baseUrl.length <= 0) {
			return null;
		}
		var url = null;
		try {
			var url = new fr.hardcoding.scrollupfolder.returnURL(baseUrl);
		}
		catch(ex) {
			return null;
		}
		if (url == null) {
			return null;
		}
		var domain = url.host;
		if (domain == null) {
			return null;
		}
		var resolvedUrl;
		var indexGetParam = baseUrl.indexOf('?');
		if (baseUrl.charAt(baseUrl.length - 1) == '/') {
			resolvedUrl = fr.hardcoding.scrollupfolder.doResolve(baseUrl, '..');
		} else if (indexGetParam != -1) {
			// Improvement for GET variables
			resolvedUrl = baseUrl.substring(0, indexGetParam);
		} else {
			resolvedUrl = fr.hardcoding.scrollupfolder.doResolve(baseUrl, '.');
		}
		if (resolvedUrl != baseUrl) {
			returnUrl = resolvedUrl;
		} else {
			/* lets see if can go up domain */
			/* delete first . of domain */
			var newDomain = domain.replace(/.*?\./,'');
			var currentURI = getBrowser().selectedBrowser.currentURI;
			// sendLog({'old': content.document.domain, 'new': currentURI.host});
			if (newDomain != null && newDomain != content.document.domain && newDomain.indexOf('.') != -1) {
				/* if one period add www */
				var matches = newDomain.match(/\./g);
				if(matches != null && matches.length <= 1) {
					returnUrl='http://www.'+newDomain+'/';
				} else {
					returnUrl='http://'+newDomain+'/';
				}
			} else {
				return null;
			}
		}
		if (returnUrl == baseUrl) {
			return null;
		}

		return returnUrl;
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

//Send debug message to console (debug only)
function sendLog(msg) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
	if (msg == null)
		msg = "[valeure nulle]"
	if (typeof msg == 'object') {
		var newMsg = '';
		for(item in msg) {
			newMsg+= "'"+item+"' => '"+msg[item]+"', \n";
		}
		msg = newMsg.substring(0, newMsg.length-3);
	}
	consoleService.logStringMessage(msg);
}

// Add onLoad event
getBrowser().addEventListener('load', fr.hardcoding.scrollupfolder.onLoad, true);

//alert('chargement de SUF');