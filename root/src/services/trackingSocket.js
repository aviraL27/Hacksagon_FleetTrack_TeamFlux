import { io } from 'socket.io-client';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || rawApiBaseUrl.replace(/\/api\/?$/, '');

export const TRACKING_LOCATION_EVENTS = ['tracking:location:update'];

let trackingSocket = null;
let activeConsumers = 0;
let disconnectTimer = null;
let lastAuthKey = null;

function createTrackingSocket({ token }) {
  return io(SOCKET_URL, {
    autoConnect: false,
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  });
}

function ensureTrackingSocket({ token }) {
  const authKey = token || '';

  if (!trackingSocket) {
    trackingSocket = createTrackingSocket({ token });
    lastAuthKey = authKey;
    return trackingSocket;
  }

  if (lastAuthKey !== authKey) {
    trackingSocket.auth = { token };
    trackingSocket.io.opts.auth = trackingSocket.auth;
    lastAuthKey = authKey;

    if (trackingSocket.connected) {
      trackingSocket.disconnect();
    }
  }

  return trackingSocket;
}

export function acquireTrackingSocket({ token }) {
  activeConsumers += 1;

  if (disconnectTimer) {
    window.clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }

  const socket = ensureTrackingSocket({ token });

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function releaseTrackingSocket() {
  activeConsumers = Math.max(0, activeConsumers - 1);

  if (activeConsumers > 0 || !trackingSocket) {
    return;
  }

  disconnectTimer = window.setTimeout(() => {
    if (activeConsumers > 0 || !trackingSocket) {
      return;
    }

    trackingSocket.disconnect();
    disconnectTimer = null;
  }, 1000);
}
