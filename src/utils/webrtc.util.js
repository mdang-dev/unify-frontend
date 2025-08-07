export const createPeerConnection = (config = {}) => {
  const defaultConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  return new RTCPeerConnection({ ...defaultConfig, ...config });
};

export const getUserMedia = async (constraints = { video: true, audio: true }) => {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error accessing media devices:', error);
    }
    throw new Error('Failed to access camera/microphone');
  }
};
