import * as React from 'react';

/**
 * 📱 Custom hook to detect if a CSS media query matches.
 * Useful for responsive behavior in React components.
 *
 * Original inspiration: https://github.com/juliencrn/usehooks-ts
 *
 * @param {string} query - The media query string (e.g., '(max-width: 768px)')
 * @returns {boolean} - Whether the query currently matches the viewport
 * @internal
 */
export function useMediaQuery(query) {
  // Checks if the query matches the current window size
  const getMatches = (query) => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  // Store match state
  const [matches, setMatches] = React.useState(getMatches(query));

  // Update match state when media query changes
  function handleChange() {
    setMatches(getMatches(query));
  }

  React.useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Trigger check on first render or if query changes
    handleChange();

    // Add listener for changes
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange); // Old browsers
    } else {
      matchMedia.addEventListener('change', handleChange); // Modern
    }

    // Cleanup listener on unmount
    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener('change', handleChange);
      }
    };
  }, [query]);

  return matches;
}
