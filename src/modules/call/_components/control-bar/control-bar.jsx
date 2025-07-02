'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Track } from 'livekit-client';
import {
  GearIcon,
  ChatIcon,
  MediaDeviceMenu,
  ChatToggle,
  StartMediaButton,
  useMaybeLayoutContext,
  useLocalParticipantPermissions,
  usePersistentUserChoices,
  DisconnectButton,
} from '@livekit/components-react';
import { MdCallEnd } from 'react-icons/md';
import { mergeProps } from '@/src/utils/livekit.util';
import { useMediaQuery } from '@/src/hooks/use-media-query';
import { SettingsMenuToggle } from './_components/settings-menu-toggle';
import { supportsScreenSharing } from '@livekit/components-core';
import { TrackToggle } from '../track-toggle/track-toggle';

const trackSourceToProtocol = (source) => {
  // NOTE: this mapping avoids importing the protocol package as that leads to a significant bundle size increase
  switch (source) {
    case Track.Source.Camera:
      return 1;
    case Track.Source.Microphone:
      return 2;
    case Track.Source.ScreenShare:
      return 3;
    default:
      return 0;
  }
};

export default function ControlBar({
  variation,
  controls,
  saveUserChoices = true,
  onDeviceError,
  ...props
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const layoutContext = useMaybeLayoutContext();

  useEffect(() => {
    if (layoutContext?.widget.state?.showChat !== undefined) {
      setIsChatOpen(layoutContext.widget.state.showChat);
    }
  }, [layoutContext?.widget.state?.showChat]);

  const isTooLittleSpace = useMediaQuery(`(max-width: ${isChatOpen ? 1000 : 760}px)`);
  variation = variation ?? (isTooLittleSpace ? 'minimal' : 'verbose');

  const visibleControls = { leave: true, ...controls };
  const localPermissions = useLocalParticipantPermissions();

  if (!localPermissions) {
    visibleControls.camera = false;
    visibleControls.chat = false;
    visibleControls.microphone = false;
    visibleControls.screenShare = false;
  } else {
    const canPublishSource = (source) =>
      localPermissions.canPublish &&
      (localPermissions.canPublishSources.length === 0 ||
        localPermissions.canPublishSources.includes(trackSourceToProtocol(source)));

    visibleControls.camera ??= canPublishSource(Track.Source.Camera);
    visibleControls.microphone ??= canPublishSource(Track.Source.Microphone);
    visibleControls.screenShare ??= canPublishSource(Track.Source.ScreenShare);
    visibleControls.chat ??= localPermissions.canPublishData && controls?.chat;
  }

  const showIcon = useMemo(() => variation === 'minimal' || variation === 'verbose', [variation]);
  const showText = useMemo(() => variation === 'textOnly' || variation === 'verbose', [variation]);

  const browserSupportsScreenSharing = supportsScreenSharing();
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  const onScreenShareChange = useCallback((enabled) => setIsScreenShareEnabled(enabled), []);

  const htmlProps = mergeProps({ className: 'lk-control-bar' }, props);

  const {
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({ preventSave: !saveUserChoices });

  const microphoneOnChange = useCallback(
    (enabled, isUserInitiated) => {
      if (isUserInitiated) saveAudioInputEnabled(enabled);
    },
    [saveAudioInputEnabled]
  );

  const cameraOnChange = useCallback(
    (enabled, isUserInitiated) => {
      if (isUserInitiated) saveVideoInputEnabled(enabled);
    },
    [saveVideoInputEnabled]
  );

  return (
    <div {...htmlProps}>
      {visibleControls.microphone && (
        <div className="lk-button-group">
          <TrackToggle
            source={Track.Source.Microphone}
            showIcon={showIcon}
            onChange={microphoneOnChange}
            onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Microphone, error })}
          ></TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              kind="audioinput"
              onActiveDeviceChange={(_, deviceId) => saveAudioInputDeviceId(deviceId ?? 'default')}
            />
          </div>
        </div>
      )}

      {visibleControls.camera && (
        <div className="lk-button-group">
          <TrackToggle
            source={Track.Source.Camera}
            showIcon={showIcon}
            onChange={cameraOnChange}
            onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Camera, error })}
          ></TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              kind="videoinput"
              onActiveDeviceChange={(_, deviceId) => saveVideoInputDeviceId(deviceId ?? 'default')}
            />
          </div>
        </div>
      )}

      {visibleControls.screenShare && browserSupportsScreenSharing && (
        <TrackToggle
          source={Track.Source.ScreenShare}
          captureOptions={{ audio: true, selfBrowserSurface: 'include' }}
          showIcon={showIcon}
          onChange={onScreenShareChange}
          onDeviceError={(error) => onDeviceError?.({ source: Track.Source.ScreenShare, error })}
        >
          {showText && (isScreenShareEnabled ?? 'Stop screen share')}
        </TrackToggle>
      )}

      {visibleControls.chat && (
        <ChatToggle>
          {showIcon && <ChatIcon />}
          {showText && 'Chat'}
        </ChatToggle>
      )}

      {visibleControls.settings && (
        <SettingsMenuToggle>
          {showIcon && <GearIcon />}
          {showText && 'Settings'}
        </SettingsMenuToggle>
      )}

      {visibleControls.leave && (
        <DisconnectButton className="!m-0 !border-none !bg-transparent !p-0">
          <div className="end-call-button">{showIcon && <MdCallEnd size={20} />}</div>
        </DisconnectButton>
      )}

      <StartMediaButton />
    </div>
  );
}
