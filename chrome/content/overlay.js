// Scroll Up Folder object
var scrollupfolder = {
	/**
	 * Preferences service.
	 */
	prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),

	/**
	 * Add events.
	 */
	onload: function(event) {
		// Remove event on load
		gBrowser.removeEventListener('load', scrollupfolder.onload, true);
		// Add scrolling event on urlbar-container
		document.getElementById('urlbar-container').addEventListener('DOMMouseScroll', scrollupfolder.scrollbar, true);
		// Add clicking event on urlbar
		document.getElementById('urlbar').addEventListener('click', scrollupfolder.clickbar, true);
		// Add focusing envent on urlbar-container
		document.getElementById('urlbar-container').addEventListener('mouseover', scrollupfolder.focused, true);
	},

	/**
	 * Generate paths for a tab.
	 */
	focused: function(e) {
		// Get current tab
		var currentTab = getBrowser().selectedBrowser;
		// Get current URI (not from urlbar, but loaded URI from current tab)
		var path = currentTab.currentURI.spec;
		// Check if path are already generated and if they tally with current URI or if doesn't been generated because it's an about: URI
		if ((currentTab.SUFPaths && currentTab.SUFPaths.indexOf(path) == -1) || (!currentTab.SUFPaths && path.substr(0, 6) != 'about:')) {
			// Initialize paths
			var paths = new Array();
			sendLog('init');
			// Create paths
			while(path != null)	{
				paths.push(path);
				path = scrollupfolder.canGoUp(path);
			}
			// Set path to current tab
			currentTab.SUFPaths = paths;
			// Set pointer position
			currentTab.SUFPointer = 0;
		} 
	},

	/**
	 * Apply chosen URI.
	 */
	clickbar: function(e) {
		// Getting chosen url
		var url = document.getElementById('urlbar').value;
		// Check event (only middle-clic) and url
		if (e.button != 1 || url == null || url.length <= 0) {
			return;
		}
		try {
			// Create valid URI from chosen url
			var urlClean = scrollupfolder.returnURL(url);
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
	 */
	scrollbar: function(e)	{
		var currentTab = getBrowser().selectedBrowser;
		// Check if paths were generated
		if (!currentTab.SUFPaths) {
			return;
		}
		// Go up in paths list
		if(e.detail < 0 && currentTab.SUFPointer < currentTab.SUFPaths.length-1)
			currentTab.SUFPointer++;
		// Go down in paths list
		else if (e.detail > 0 && currentTab.SUFPointer > 0)
			currentTab.SUFPointer--;
		// Display chosen path and select it
		document.getElementById('urlbar').value = currentTab.SUFPaths[currentTab.SUFPointer];
		document.getElementById('urlbar').select();
	},

	canGoUp : function(baseUrl)	{
		var returnUrl;
		if(baseUrl == null || baseUrl.length <= 0) {
			return null;
		}
		var url = null;
		try {
			var url = new scrollupfolder.returnURL(baseUrl);
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
			resolvedUrl = scrollupfolder.doResolve(baseUrl, '..');
		} else if (indexGetParam != -1) {
			// Improvement for GET variables
			resolvedUrl = baseUrl.substring(0, indexGetParam);
		} else {
			resolvedUrl = scrollupfolder.doResolve(baseUrl, '.');
		}
		if (resolvedUrl != baseUrl) {
			returnUrl = resolvedUrl;
		} else {
			/* lets see if can go up domain */
			/* delete first . of domain */
			var newDomain = domain.replace(/.*?\./,'');
			var currentURI = getBrowser().selectedBrowser.currentURI;
			sendLog(['old', content.document.domain]);
			sendLog(['new', currentURI.host]);
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

// Add onload event
getBrowser().addEventListener('load', scrollupfolder.onload, true);

// Send debug message to console (debug only)
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