import { create } from 'zustand';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

export const useCallStore = create((set, get) => ({
  signalingClient: null,
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  inCall: false,
  role: null,
  otherUser: null,
  timer: 0,
  intervalId: null,
  micOn: true,
  camOn: true,
  screenSharing: false,
  notifySound: null,
  broadcastChannel: null,
  // ✅ OPTIMIZED: Add audio cache to prevent creating new Audio objects
  audioCache: new Map(),

  init: async (userId) => {
    const bc = new BroadcastChannel('smartcall');
    bc.onmessage = (e) => {
      if (e.data.type === 'incoming_call') {
        const state = get();
        state.playRing();
        set({ otherUser: e.data.from });
        // Display notification UI in app
      }
    };

    // Fetch CSRF token for WebSocket connection with better error handling
    let csrfToken = null;
    try {
      const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/auth/csrf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        csrfToken = data.token;
      }
    } catch (error) {
      // Continue without CSRF token if fetch fails
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const client = Stomp.over(() => new SockJS(`${apiUrl}/ws`));
    const authToken = getCookie(COOKIE_KEYS.AUTH_TOKEN);
    client.connect({
      ...(authToken ? { token: `Bearer ${authToken}` } : {}),
      ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
    }, () => {
      client.subscribe(`/queue/call/${userId}`, (msg) => {
        const data = JSON.parse(msg.body);
        get().handleSignaling(data);
      });
    });
    set({ signalingClient: client, broadcastChannel: bc });
  },

  playRing: () => {
    const state = get();
    // ✅ OPTIMIZED: Use cached audio object instead of creating new one
    if (!state.audioCache.has('ring')) {
      const sound = new Audio('/sounds/ring.mp3');
      // ✅ OPTIMIZED: Preload audio to prevent memory issues
      sound.preload = 'auto';
      state.audioCache.set('ring', sound);
    }
    
    const sound = state.audioCache.get('ring');
    // ✅ OPTIMIZED: Reset audio to beginning before playing
    sound.currentTime = 0;
    sound.play().catch(error => {
      // console.warn('Failed to play ring sound:', error);
    });
  },

  playStart: () => {
    const state = get();
    // ✅ OPTIMIZED: Use cached audio object instead of creating new one
    if (!state.audioCache.has('start')) {
      const sound = new Audio('/sounds/start.mp3');
      // ✅ OPTIMIZED: Preload audio to prevent memory issues
      sound.preload = 'auto';
      state.audioCache.set('start', sound);
    }
    
    const sound = state.audioCache.get('start');
    // ✅ OPTIMIZED: Reset audio to beginning before playing
    sound.currentTime = 0;
    sound.play().catch(error => {
      // console.warn('Failed to play start sound:', error);
    });
  },

  sendSignal: (msg) => {
    // Send WebRTC signaling messages through STOMP WebSocket
    const { signalingClient, otherUser } = get();
    if (signalingClient && signalingClient.connected) {
      // Send signaling message to the other user's call endpoint
      signalingClient.send(
        `/app/call/${otherUser}`,
        {},
        JSON.stringify({ ...msg, from: get().userId })
      );
      // Remove unnecessary debug logs
    } else {
      // Only log critical connection issues
      // console.warn('Not connected, cannot send signal');
    }
  },
  startCall: async (otherUser) => {
    // Initialize call as the caller and set up WebRTC connection
    set({ role: 'caller', otherUser });
    await get().setupMedia();
    const pc = get().createPeer();
    // Create and send WebRTC offer to establish connection
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    get().sendSignal({ type: 'OFFER', sdp: offer.sdp });

    // Open call window in new tab and set up broadcast channel for communication
    const bc = get().broadcastChannel;
    window.open('/call', '_blank');

    // ✅ OPTIMIZED: Send restore message every 500ms until the call window is ready
    const interval = setInterval(() => {
      bc.postMessage({ type: 'restore', role: 'caller', otherUser });
    }, 500);
    
    // ✅ OPTIMIZED: Store interval ID for cleanup
    set({ intervalId: interval });

    bc.onmessage = (e) => {
      if (e.data.type === 'ready') {
        bc.postMessage({ type: 'restore', role: 'caller', otherUser });
        clearInterval(interval);
      }
    };
  },
  setupMedia: async () => {
    // Request access to user's camera and microphone for video call
    const local = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    set({ localStream: local });
  },

  createPeer: () => {
    // Create WebRTC peer connection with STUN server for NAT traversal
    const state = get();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    // Add local media tracks to the peer connection
    state.localStream.getTracks().forEach((track) => pc.addTrack(track, state.localStream));
    // Handle incoming remote stream
    pc.ontrack = (event) => set({ remoteStream: event.streams[0] });
    // Send ICE candidates for connection establishment
    pc.onicecandidate = (event) => {
      if (event.candidate) state.sendSignal({ type: 'ICE', candidate: event.candidate });
    };
    // Handle connection state changes and end call on failure
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        get().endCall();
      }
    };
    set({ peerConnection: pc });
    return pc;
  },

  handleSignaling: async (msg) => {
    const state = get();
    switch (msg.type) {
      case 'OFFER':
        set({ role: 'callee', otherUser: msg.from });
        await state.setupMedia();
        const pc = state.createPeer();
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: msg.sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        state.sendSignal({ type: 'ANSWER', sdp: answer.sdp });
        break;
      case 'ANSWER':
        await state.peerConnection.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: msg.sdp })
        );
        break;
      case 'ICE':
        await state.peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate));
        break;
      case 'END':
        state.endCall();
        break;
    }
  },

  toggleMic: () =>
    set((s) => {
      if (!s.localStream) return {}; // avoid error
      const track = s.localStream.getAudioTracks()[0];
      if (!track) return {};
      track.enabled = !track.enabled;
      return { micOn: track.enabled };
    }),

  toggleCam: () =>
    set((s) => {
      if (!s.localStream) return {};
      const track = s.localStream.getVideoTracks()[0];
      if (!track) return {};
      track.enabled = !track.enabled;
      return { camOn: track.enabled };
    }),

  shareScreen: async () => {
    const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screen.getVideoTracks()[0];
    const sender = get()
      .peerConnection.getSenders()
      .find((s) => s.track.kind === 'video');
    sender.replaceTrack(screenTrack);
    screenTrack.onended = () => get().stopShare();
    set({ screenSharing: true });
  },

  stopShare: () => {
    const state = get();
    const originalTrack = state.localStream.getVideoTracks()[0];
    const sender = state.peerConnection.getSenders().find((s) => s.track.kind === 'video');
    sender.replaceTrack(originalTrack);
    set({ screenSharing: false });
  },

  endCall: () => {
    const state = get();
    
    // ✅ OPTIMIZED: Cleanup all resources
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }
    
    if (state.peerConnection) {
      state.peerConnection.close();
    }
    
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
    }
    
    if (state.signalingClient) {
      state.signalingClient.disconnect();
    }
    
    if (state.broadcastChannel) {
      state.broadcastChannel.close();
    }
    
    // ✅ OPTIMIZED: Clear audio cache to free memory
    state.audioCache.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    state.audioCache.clear();
    
    set({
      inCall: false,
      role: null,
      otherUser: null,
      timer: 0,
      intervalId: null,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      signalingClient: null,
      broadcastChannel: null
    });
  },
}));
