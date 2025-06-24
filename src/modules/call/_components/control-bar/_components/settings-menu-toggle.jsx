import React, { forwardRef } from 'react';
import { useSettingsToggle } from '../../../hooks/use-settings-toggle';

/**
 * SettingsMenuToggle is a button that toggles the visibility of the SettingsMenu.
 *
 * NOTE: This component must be used inside a LayoutContext for it to work properly.
 */
export const SettingsMenuToggle = forwardRef(function SettingsMenuToggle(props, ref) {
  const { mergedProps } = useSettingsToggle({ props });

  return (
    <button ref={ref} {...mergedProps}>
      {props.children}
    </button>
  );
});
