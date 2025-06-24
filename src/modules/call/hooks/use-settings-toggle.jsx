import { useLayoutContext } from '@livekit/components-react';
import { mergeProps } from '@/src/utils/livekit.util';
import React from 'react';

/**
 * useSettingsToggle hook provides props for toggling the settings menu.
 *
 * Note: Must be used within a LayoutContext to function properly.
 * Typically used with the <SettingsMenuToggle /> component.
 */
export function useSettingsToggle({ props }) {
  const { dispatch, state } = useLayoutContext().widget;
  const className = 'lk-button lk-settings-toggle';

  const mergedProps = React.useMemo(() => {
    return mergeProps(props, {
      className,
      onClick: () => {
        if (dispatch) dispatch({ msg: 'toggle_settings' });
      },
      'aria-pressed': state?.showSettings ? 'true' : 'false',
    });
  }, [props, className, dispatch, state]);

  return { mergedProps };
}
