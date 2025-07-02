import * as React from 'react';
import { Track, ConnectionQuality } from 'livekit-client';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaDesktop,
  FaTimesCircle,
  FaSignal,
  FaQuestionCircle,
} from 'react-icons/fa';
import { MdSignalCellular4Bar, MdSignalCellular2Bar, MdSignalCellular0Bar } from 'react-icons/md';

const ICON_SIZE = 20;
const CLASS_ENABLED = 'text-white';
const CLASS_DISABLED = 'text-red-500';
const CLASS_SCREENSHARE_STOP = 'text-yellow-500';

/**
 * Returns an icon based on the media source (microphone, camera, screenShare) and whether it's enabled.
 */
export function getSourceIcon(source, enabled) {
  switch (source) {
    case Track.Source.Microphone:
      return enabled ? (
        <FaMicrophone size={ICON_SIZE} className={CLASS_ENABLED} />
      ) : (
        <FaMicrophoneSlash size={ICON_SIZE} className={CLASS_DISABLED} />
      );
    case Track.Source.Camera:
      return enabled ? (
        <FaVideo size={ICON_SIZE} className={CLASS_ENABLED} />
      ) : (
        <FaVideoSlash size={ICON_SIZE} className={CLASS_DISABLED} />
      );
    case Track.Source.ScreenShare:
      return enabled ? (
        <FaTimesCircle size={ICON_SIZE} className={CLASS_SCREENSHARE_STOP} />
      ) : (
        <FaDesktop size={ICON_SIZE} className={CLASS_ENABLED} />
      );
    default:
      return null;
  }
}

/**
 * Returns an icon that represents the current connection quality.
 */
export function getConnectionQualityIcon(quality) {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return <MdSignalCellular4Bar size={ICON_SIZE} className="text-green-500" />;
    case ConnectionQuality.Good:
      return <MdSignalCellular2Bar size={ICON_SIZE} className="text-yellow-400" />;
    case ConnectionQuality.Poor:
      return <MdSignalCellular0Bar size={ICON_SIZE} className="text-red-500" />;
    default:
      return <FaQuestionCircle size={ICON_SIZE} className="text-gray-400" />;
  }
}
