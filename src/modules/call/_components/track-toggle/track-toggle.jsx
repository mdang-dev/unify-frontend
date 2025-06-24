import React, { forwardRef, useEffect, useState } from 'react';
import { getSourceIcon } from './_components/get-source-icon';
import { useTrackToggle } from '@livekit/components-react';

/**
 * TrackToggle lets the user toggle (mute/unmute) microphone or camera.
 *
 * Props:
 * - `source`: Track source type (e.g., 'camera', 'microphone', 'screenShare')
 * - `showIcon`: Show icon next to the button label
 * - `onChange`: Callback when state changes
 * - `captureOptions`: Optional media capture options
 * - `publishOptions`: Optional track publish options
 * - `onDeviceError`: Callback when device errors
 *
 * Example:
 * ```jsx
 * <TrackToggle source="microphone">Mic</TrackToggle>
 * <TrackToggle source="camera">Camera</TrackToggle>
 * ```
 */

export const TrackToggle = forwardRef(function TrackToggle(props, ref) {
  const { showIcon = true, ...rest } = props;
  const { buttonProps, enabled } = useTrackToggle(rest);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <button ref={ref} {...buttonProps}>
      {showIcon && getSourceIcon(props.source, enabled)}
      {props.children}
    </button>
  );
});
