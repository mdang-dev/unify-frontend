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

    // Fetch CSRF token for WebSocket connection
    let csrfToken = null;
    try {
      const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/auth/csrf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        csrfToken = data.token;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to fetch CSRF token for call:', error);
      }
    }

    const client = Stomp.over(
      () => new SockJS('http://localhost:8080/ws?token=' + getCookie(COOKIE_KEYS.AUTH_TOKEN), null, {
        transports: ['websocket'], // ✅ PERFORMANCE: WebSocket only
        timeout: 8000, // ✅ PERFORMANCE: Faster timeout
        heartbeat: 10000, // ✅ PERFORMANCE: Optimized heartbeat
      })
    );
    client.connect({
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
    const sound = new Audio('/sounds/ring.mp3');
    sound.play();
  },

  playStart: () => {
    const sound = new Audio('/sounds/start.mp3');
    sound.play();
  },

  sendSignal: (msg) => {
    const { signalingClient, otherUser } = get();
    if (signalingClient && signalingClient.connected) {
      signalingClient.send(
        `/app/call/${otherUser}`,
        {},
        JSON.stringify({ ...msg, from: get().userId })
      );
      console.log('[STOMP] Signal sent', msg);
    } else {
      console.warn('[STOMP] Not connected, cannot send');
    }
  },
  startCall: async (otherUser) => {
    set({ role: 'caller', otherUser });
    await get().setupMedia();
    const pc = get().createPeer();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    get().sendSignal({ type: 'OFFER', sdp: offer.sdp });

    const bc = get().broadcastChannel;
    window.open('/call', '_blank');

    const interval = setInterval(() => {
      bc.postMessage({ type: 'restore', role: 'caller', otherUser });
    }, 500);

    bc.onmessage = (e) => {
      if (e.data.type === 'ready') {
        bc.postMessage({ type: 'restore', role: 'caller', otherUser });
        clearInterval(interval);
      }
    };
  },
  setupMedia: async () => {
    const local = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    set({ localStream: local });
  },

  createPeer: () => {
    const state = get();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    state.localStream.getTracks().forEach((track) => pc.addTrack(track, state.localStream));
    pc.ontrack = (event) => set({ remoteStream: event.streams[0] });
    pc.onicecandidate = (event) => {
      if (event.candidate) state.sendSignal({ type: 'ICE', candidate: event.candidate });
    };
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
    if (state.peerConnection) state.peerConnection.close();
    if (state.localStream) state.localStream.getTracks().forEach((track) => track.stop());
    clearInterval(state.intervalId);
    set({
      inCall: false,
      timer: 0,
      intervalId: null,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
    });
  },
}));
