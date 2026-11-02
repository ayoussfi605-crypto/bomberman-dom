// Framework Client-Side Router (Hash-based)

export function createRouter(routes = {}) {
  // Get current route path from URL hash (e.g. "#/active" -> "/active")
  function getPath() {
    const hash = window.location.hash.slice(1); // remove '#'
    return hash || '/'; // Default route if hash is empty
  }

  // Find matching route and run its callback function
  function handleRoute() {
    const currentPath = getPath();
    const routeCallback = routes[currentPath] || routes['/']; // Fallback to '/' if route not found
    
    if (typeof routeCallback === 'function') {
      routeCallback(currentPath);
    }
  }

  return {
    // Navigate programmatically to a new path (e.g., router.navigate('/active'))
    navigate(path) {
      window.location.hash = path;
    },

    // Start listening for URL hash changes and execute initial route
    start() {
      // Listen to browser hash changes (Back/Forward buttons or clicking links)
      window.addEventListener('hashchange', handleRoute);

      // Execute route callback immediately on page load
      handleRoute();
    }
  };
}