/// <reference types="vite/client" />

interface Window {
  screenShare?: {
    platform: string;
    ping: () => Promise<unknown>;
  };
}
