import React from 'react';
import { log } from '@livekit/components-core';
import clsx from 'clsx';

/**
 * Chains multiple functions so they are called in order with the same arguments.
 * If any function throws, it logs the error but continues calling others.
 * @internal
 */
export function chain(...callbacks) {
  return (...args) => {
    for (const callback of callbacks) {
      if (typeof callback === 'function') {
        try {
          callback(...args);
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.error(e);
          }
        }
      }
    }
  };
}

/**
 * Merges multiple props objects into one.
 *
 * - **Event handlers** (e.g. onClick, onChange) are chained together.
 * - **className** values are combined using `clsx`.
 * - **All other props**: the last one overrides earlier ones.
 *
 * This is especially useful in custom UI components where you want
 * to allow user-defined event handlers while preserving default ones.
 *
 * @param  {...Object} args - List of props objects to merge.
 * @returns {Object} - A single merged props object.
 * @internal
 */
export function mergePropsReactAria(...args) {
  // Clone the first object as a base
  const result = { ...args[0] };

  for (let i = 1; i < args.length; i++) {
    const props = args[i];
    for (const key in props) {
      const a = result[key];
      const b = props[key];

      // If both are functions and key starts with 'on' followed by uppercase, assume it's an event
      if (
        typeof a === 'function' &&
        typeof b === 'function' &&
        key[0] === 'o' &&
        key[1] === 'n' &&
        key.charCodeAt(2) >= 65 && // 'A'
        key.charCodeAt(2) <= 90 // 'Z'
      ) {
        result[key] = chain(a, b);
      }

      // Merge class names
      else if (
        (key === 'className' || key === 'UNSAFE_className') &&
        typeof a === 'string' &&
        typeof b === 'string'
      ) {
        result[key] = clsx(a, b);
      }

      // Default: override or keep original if b is undefined
      else {
        result[key] = b !== undefined ? b : a;
      }
    }
  }

  return result;
}

/**
 * Internal helper to check if a prop is defined.
 */
export function isProp(prop) {
  return prop !== undefined;
}

/**
 * Internal helper to merge multiple HTML attribute props.
 * Filters out undefined props and uses the React Aria mergeProps function.
 */
export function mergeProps(...props) {
  return mergePropsReactAria(...props.filter(isProp));
}

/**
 * Internal helper to clone a single child element and merge additional props.
 * Preserves original className and style.
 */
export function cloneSingleChild(children, props = {}, key) {
  return React.Children.map(children, (child) => {
    if (React.isValidElement(child) && React.Children.count(children) === 1) {
      if (child.props.className) {
        props.className = clsx(child.props.className, props.className);
        props.style = { ...child.props.style, ...props.style };
      }
      return React.cloneElement(child, { ...props, key });
    }
    return child;
  });
}

/**
 * Internal utility to warn developers if LiveKit's default styles are missing.
 * This is helpful during development.
 */
export function warnAboutMissingStyles(el) {
  if (
    typeof window !== 'undefined' &&
    typeof process !== 'undefined' &&
    (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development')
  ) {
    const target = el ?? document.querySelector('.lk-room-container');
    if (target && !getComputedStyle(target).getPropertyValue('--lk-has-imported-styles')) {
      log.warn(
        "It looks like you're not using the `@livekit/components-styles` package. To render the UI with the default styling, please import it in your layout or page."
      );
    }
  }
}

/**
 * Internal replacer function for JSON.stringify().
 * Used to convert roomOptions into a stable string for hook dependency arrays.
 */
export function roomOptionsStringifyReplacer(key, val) {
  if (key === 'processor' && val && typeof val === 'object' && 'name' in val) {
    return val.name;
  }
  if (key === 'e2ee' && val) {
    return 'e2ee-enabled';
  }
  return val;
}
