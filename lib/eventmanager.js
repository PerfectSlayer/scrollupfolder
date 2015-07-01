// Declare event handler collection
var eventHandlers = {};

/**
 * Create an event type handler.
 * @param	eventType		The event type to create handler.
 */
function createHandler (eventType) {
	// Create object with listener collection and notifier function
	eventHandlers[eventType] = {
		listeners: [],
		notifier: function (event) {
			// Notify each listener
			for (var listener of eventHandlers[eventType].listeners) {
				listener(event);
			}
		}
	}
}

/**
 * Register a listener for an event type.
 * @param   eventType		The event type to register the listener.
 * @param   listener		The listener to register.
 */
function register (eventType, listener) {
	// Check listener
	if (typeof listener !== 'function') {
		console.warn('The listener is not a function.');
		return;
	}
	// Check if event type handler already exists
	if (!eventHandlers[eventType]) {
		// Create event type handler
		createHandler(eventType);
	}
	// Get event type listeners
	var listeners = eventHandlers[eventType].listeners;
	// Check if listener is already registered
	if (listeners.indexOf(listener) != -1) {
		console.warn('The listener is already registered.');
		return;
	}
	// Remove listener
	listeners.push(listener);
}

/**
 * Unregister a listener.
 * @param   eventType		The event type to unregister the listener.
 * @param   listener		The listener to unregister.
 */
function unregister (eventType, listener) {
	// Check if event type handler exists
	if (!eventHandlers[eventType]) {
		console.warn('There is no listener for this event type.');
		return;
	}
	// Get event type listeners
	var listeners = eventHandlers[eventType].listeners;
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
 * @param   eventType		An array of event types to attach to subject (optionnal).
 */
function attach (subject, eventTypes = null) {
	// Check event types
	if (!Array.isArray(eventTypes)) {
		// Create event types
		eventTypes = [];
		// Add all available event types
		for (var eventType in events) {
			eventTypes.push(eventType);
		}
	}
	// Attach each event type
	for (var eventType of eventTypes) {
		// Check if event type handler exists
		if (!eventHandlers[eventType]) {
			// Create event type handler
			createHandler(eventType);
		}
		// Add notifier as event listener
		subject.addEventListener(eventType, eventHandlers[eventType].notifier, true);
	}
}

/**
 * Detach listeners to a subject.
 * @param   subject			The subject to detach listeners.
 * @param   eventType		An array of event types to detach to subject (optionnal).
 */
function detach (subject, eventTypes = null) {
	// Check event types
	if (!Array.isArray(eventTypes)) {
		// Create event types
		eventTypes = [];
		// Add all available event types
		for (var eventType in events) {
			eventTypes.push(eventType);
		}
	}
	// Detach each event type
	for (var eventType of eventTypes) {
		// Check if event type handler exists
		if (!eventHandlers[eventType]) {
			console.warn('There is no listener for this event type.');
			continue;
		}
		// Remove notifier from event listener
		subject.removeEventListener(eventType, eventHandlers[eventType].notifier, true);
	}
}

// Export public API
exports.register = register;
exports.unregister = unregister;
exports.attach = attach;
exports.detach = detach;
