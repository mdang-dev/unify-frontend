import { useState } from 'react';
import { FaUser } from 'react-icons/fa';
import clsx from 'clsx';

const ParticipantAvatar = ({ trackReference, isSpeaking }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const avatar =
    JSON.parse(trackReference.participant?.metadata || '{}').avatar || '/images/unify_icon_2.png';

  return (
    <div className="lk-participant-placeholder relative flex items-center justify-center bg-transparent">
      {/* Skeleton with icon */}
      {!isImageLoaded && (
        <div className="absolute flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-gray-100 shadow-md dark:bg-gray-700">
          <FaUser className="text-4xl text-gray-400" />
        </div>
      )}

      {/* Avatar */}
      <img
        src={avatar}
        alt="Avatar"
        onLoad={() => setIsImageLoaded(true)}
        className={clsx(
          'h-24 w-24 rounded-full object-cover transition-all duration-300',
          isSpeaking && 'discord-glow',
          !isImageLoaded && 'invisible'
        )}
      />
    </div>
  );
};

export default ParticipantAvatar;
