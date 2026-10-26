//EVENT_MAP (Translate) -> addEvent (Clean Old + Attach New) -> handleKey (Shortcuts) -> removeEvents (RAM Cleanup)
// Map framework props to native browser DOM events
const EVENT_MAP = {
  onClick: 'click',
  onInput: 'input',
  onChange: 'change',
  onKeyDown: 'keydown',
  onKeyUp: 'keyup', 
  onSubmit: 'submit',
  onDblClick: 'dblclick'
};

// Attach custom event listener and prevent duplicate listeners
export function addEvent(element, propName, handler) {
  // Get native DOM event name (e.g., 'onClick' -> 'click')
  const nativeEvent = EVENT_MAP[propName];

  // Stop if event name is invalid or handler is not a function
  if (!nativeEvent || typeof handler !== 'function') return;

  // Create listener storage object if it does not exist
  if (!element._listeners) {
    element._listeners = {};
  }

  // Remove old event listener if it already exists
  if (element._listeners[propName]) {
    element.removeEventListener(nativeEvent, element._listeners[propName]);
  }

  // Save new handler in element storage
  element._listeners[propName] = handler;

  // Add new event listener to the native DOM element
  element.addEventListener(nativeEvent, handler);
}

// Remove all event listeners when element is deleted from DOM
export function removeEvents(element) {
  // Stop if element has no saved listeners
  if (!element._listeners) return;

  // Loop through all saved event handlers
  for (const propName in element._listeners) {
    const nativeEvent = EVENT_MAP[propName];
    if (nativeEvent) {
      // Remove each event listener from browser RAM
      element.removeEventListener(nativeEvent, element._listeners[propName]);
    }
  }

  // Delete storage property to completely clear memory
  delete element._listeners;
}

// Helper function for handling keyboard shortcuts (Enter & Escape)
export function handleKey(e, onEnter, onEscape) {
  // Execute onEnter callback if Enter key is pressed
  if (e.key === 'Enter' && onEnter) {
    onEnter(e);
  // Execute onEscape callback if Escape key is pressed
  } else if (e.key === 'Escape' && onEscape) {
    onEscape(e);
  }
}