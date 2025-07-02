import { isTrackReference, isTrackReferencePinned } from '@livekit/components-core';
import {
  TrackRefContextIfNeeded,
  ParticipantContextIfNeeded,
  VideoTrack,
  AudioTrack,
  LockLockedIcon,
  TrackMutedIndicator,
  ParticipantName,
  ConnectionQualityIndicator,
  FocusToggle,
  useParticipantTile,
  useEnsureTrackRef,
  useIsEncrypted,
  useMaybeLayoutContext,
  useFeatureContext,
} from '@livekit/components-react';
import clsx from 'clsx';
import { Track } from 'livekit-client';
import { ScreenShareIcon } from 'lucide-react';
import { forwardRef } from 'react';
import { useCallback } from 'react';
import ParticipantAvatar from './participant-avatar';

// eslint-disable-next-line react/display-name
const ParticipantTile = forwardRef((props, ref) => {
  const { trackRef, children, onParticipantClick, disableSpeakingIndicator, ...htmlProps } = props;

  const trackReference = useEnsureTrackRef(trackRef);

  const { elementProps } = useParticipantTile({
    htmlProps,
    disableSpeakingIndicator,
    onParticipantClick,
    trackRef: trackReference,
  });

  const isEncrypted = useIsEncrypted(trackReference.participant);
  const layoutContext = useMaybeLayoutContext();
  const autoManageSubscription = useFeatureContext()?.autoSubscription;

  const handleSubscribe = useCallback(
    (subscribed) => {
      if (
        trackReference.source &&
        !subscribed &&
        layoutContext?.pin?.dispatch &&
        isTrackReferencePinned(trackReference, layoutContext.pin.state)
      ) {
        layoutContext.pin.dispatch({ msg: 'clear_pin' });
      }
    },
    [trackReference, layoutContext]
  );

  const isSpeaking = trackReference.participant?.isSpeaking;

  return (
    <div ref={ref} style={{ position: 'relative' }} {...elementProps}>
      <TrackRefContextIfNeeded trackRef={trackReference}>
        <ParticipantContextIfNeeded participant={trackReference.participant}>
          {children ?? (
            <>
              {isTrackReference(trackReference) &&
              (trackReference.publication?.kind === 'video' ||
                trackReference.source === Track.Source.Camera ||
                trackReference.source === Track.Source.ScreenShare) ? (
                <VideoTrack
                  trackRef={trackReference}
                  onSubscriptionStatusChanged={handleSubscribe}
                  manageSubscription={autoManageSubscription}
                />
              ) : (
                isTrackReference(trackReference) && (
                  <AudioTrack
                    trackRef={trackReference}
                    onSubscriptionStatusChanged={handleSubscribe}
                  />
                )
              )}

              <div className="lk-participant-placeholder flex items-center justify-center bg-transparent">
                <ParticipantAvatar isSpeaking={isSpeaking} trackReference={trackReference} />
              </div>

              <div className="lk-participant-metadata">
                <div className="lk-participant-metadata-item">
                  {trackReference.source === Track.Source.Camera ? (
                    <>
                      {isEncrypted && <LockLockedIcon style={{ marginRight: '0.25rem' }} />}
                      <TrackMutedIndicator
                        trackRef={{
                          participant: trackReference.participant,
                          source: Track.Source.Microphone,
                        }}
                        show="muted"
                      />
                      <ParticipantName />
                    </>
                  ) : (
                    <>
                      <ScreenShareIcon style={{ marginRight: '0.25rem' }} />
                      <ParticipantName>&apos;s screen</ParticipantName>
                    </>
                  )}
                </div>
                <ConnectionQualityIndicator className="lk-participant-metadata-item" />
              </div>
            </>
          )}
          <FocusToggle trackRef={trackReference} />
        </ParticipantContextIfNeeded>
      </TrackRefContextIfNeeded>
    </div>
  );
});

export default ParticipantTile;
