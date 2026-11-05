// Network adapter: the browser's online/offline events (architecture §4.2 "Netwerk"). A failed fetch
// is the stronger signal; the transport counts those (§4.7).

export interface NetworkSource {
  online(): boolean;
  subscribe(listener: (online: boolean) => void): () => void;
}

export function createNetworkSource(win: Window = window): NetworkSource {
  return {
    online: () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false),
    subscribe(listener) {
      const on = () => listener(true);
      const off = () => listener(false);
      win.addEventListener('online', on);
      win.addEventListener('offline', off);
      return () => {
        win.removeEventListener('online', on);
        win.removeEventListener('offline', off);
      };
    },
  };
}
