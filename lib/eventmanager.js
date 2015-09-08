/**
 * Event manager constructor.
 * @param	eventTypes		The event types allowed by the event manager.
 */
var EventManager = function() {
	// Declare event type handler collection
	this.eventHandlers = {};
	// Create function to fix object scope
	var fixScope = function(eventManager, eventType) {
			return function(event) {
				// Notify each listener
				for (var listener of eventManager.eventHandlers[eventType].listeners) {
					listener(event);
				}
			};
		}
		// Create each event type handler
	for (var index = 0; index < arguments.length; index++) {
		// Get event type
		var eventType = arguments[index];
		// Create object with listener collection and notifier function
		this.eventHandlers[eventType] = {
			listeners: [],
			notifier: fixScope(this, eventType)
		}
	}
}

/**
 * Register a listener for an event type.
 * @param   eventType		The event type to register the listener.
 * @param   listener		The listener to register.
 */
EventManager.prototype.register = function(eventType, listener) {
	// Check listener
	if (typeof listener !== 'function') {
		console.warn('The listener is not a function.');
		return;
	}
	// Check if event type handler exists
	if (!this.eventHandlers[eventType]) {
		console.warn('The event type is not supported by the manager.');
		return;
	}
	// Get event type listeners
	var listeners = this.eventHandlers[eventType].listeners;
	// Check if listener is already registered
	if (listeners.indexOf(listener) != -1) {
		console.warn('The listener is already registered.');
		return;
	}
	// Add listener
	listeners.push(listener);
}

/**
 * Unregister a listener.
 * @param   eventType		The event type to unregister the listener.
 * @param   listener		The listener to unregister.
 */
EventManager.prototype.unregister = function(eventType, listener) {
	// Check if event type handler exists
	if (!this.eventHandlers[eventType]) {
		console.warn('There is no listener for this event type.');
		return;
	}
	// Get event type listeners
	var listeners = this.eventHandlers[eventType].listeners;
	// Check if listener is registered
	var index = listeners.indexOf(listener);
	if (index === -1) {
		console.warn('The listener was not registered.');
		return;
	}
	// Remove listener
	listeners.splice(index, 1);
}

/**
 * Attach listeners to a subject.
 * @param   subject			The subject to attach listeners.
 */
EventManager.prototype.attach = function(subject) {
	// Attach each event type handler
	for (var eventType of Object.keys(this.eventHandlers)) {
		// Add notifier as event listener
		subject.addEventListener(eventType, this.eventHandlers[eventType].notifier, true);
	}
}

/**
 * Detach listeners to a subject.
 * @param   subject			The subject to detach listeners.
 */
EventManager.prototype.detach = function(subject, eventTypes = null) {
	// Detach each event type handler
	for (var eventType of Object.keys(this.eventHandlers)) {
		// Remove notifier from event listener
		subject.removeEventListener(eventType, this.eventHandlers[eventType].notifier, true);
	}
}

// Export public API
exports.EventManager = EventManager;
